using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using api.Common.Serialization;
using api.Controllers;
using api.Infrastructure.Hubs;
using api.Infrastructure.Jobs;
using api.Infrastructure.Middleware;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using AspNetCoreRateLimit;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using StackExchange.Redis;

// Bootstrap logger: minimal console output before host configuration loads.
// Replaced by the full configuration-driven logger in UseSerilog() below.
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Warning()
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

// ── Helper: postgresql:// URL → Npgsql connection string ─────────────────────
static string ToNpgsql(string url, bool isDevelopment)
{
    var uri      = new Uri(url);
    var userInfo = uri.UserInfo.Split(':');
    var host     = uri.Host;
    var port     = uri.Port > 0 ? uri.Port : 5432;
    var db       = uri.AbsolutePath.TrimStart('/');
    var user     = userInfo[0];
    var pass     = userInfo.Length > 1 ? userInfo[1] : "";
    var sslMode  = isDevelopment ? "Disable" : "Require";
    var trustCert = isDevelopment ? "" : ";Trust Server Certificate=true";

    // ── Connection pool tuning ────────────────────────────────────────────────
    // These values assume a single API pod against a managed PostgreSQL instance
    // (e.g. RDS db.t3.medium or Azure Database for PostgreSQL Flexible Server GP-2).
    //
    // Rule of thumb: MaxPoolSize ≤ (DB max_connections / number_of_pods) × 0.8
    // Typical managed DB: 500 max_connections, 2 pods → 500 / 2 × 0.8 = 200.
    // Err on the conservative side; a single pod consuming 100 connections is fine.
    //
    // Connection Idle Lifetime: recycle idle connections to avoid stale TCP sessions
    // after a DB failover (cloud DBs frequently change IPs on failover).
    const int maxPool            = 100;
    const int minPool            = 5;   // keep warm to avoid cold-start latency
    const int connLifetime       = 300; // seconds — force TCP recycle every 5 minutes
    const int connIdleLifetime   = 60;  // seconds — evict connections idle > 1 minute
    const int commandTimeout     = 30;  // seconds — kill runaway queries

    return $"Host={host};Port={port};Database={db};Username={user};Password={pass};" +
           $"SSL Mode={sslMode}{trustCert};" +
           $"Maximum Pool Size={maxPool};Minimum Pool Size={minPool};" +
           $"Connection Lifetime={connLifetime};Connection Idle Lifetime={connIdleLifetime};" +
           $"Command Timeout={commandTimeout};Pooling=true";
}

// ── Helper: redis:// URL → StackExchange.Redis connection string ──────────────
static string ToRedis(string url)
{
    var uri = new Uri(url);
    var host = uri.Host;
    var port = uri.Port > 0 ? uri.Port : 6379;
    var password = uri.UserInfo.Contains(':') ? uri.UserInfo.Split(':')[1] : uri.UserInfo;

    return string.IsNullOrEmpty(password) ? $"{host}:{port}" : $"{host}:{port},password={password}";
}

try
{
    var builder = WebApplication.CreateBuilder(args);
    var config = builder.Configuration;

    // ── Serilog — configuration-driven structured logging ────────────────────
    // Full settings come from appsettings.json / appsettings.{env}.json
    // "Serilog" section. ReadFrom.Configuration() wires all sinks declared
    // there (Console, File, Elasticsearch, Loki, etc.) so no sink-specific
    // code needs to live here.
    builder.Host.UseSerilog((ctx, services, lc) =>
        lc.ReadFrom.Configuration(ctx.Configuration)
          .ReadFrom.Services(services)
          .Enrich.FromLogContext()
          .Enrich.WithMachineName()
          .Enrich.WithEnvironmentName()
          .Enrich.WithProperty("Application", "marketplace-api")
    );

    // ── Production environment guard — fail fast on missing critical config ────
    // This prevents silent failures (localhost links in emails, etc.) when a
    // required env var is omitted from the production deployment.
    if (!builder.Environment.IsDevelopment())
    {
        static void Require(IConfiguration cfg, string key)
        {
            if (string.IsNullOrWhiteSpace(cfg[key]))
                throw new InvalidOperationException(
                    $"Required environment variable '{key}' is not set. " +
                    "Refusing to start in a non-Development environment without it.");
        }

        Require(config, "DATABASE_URL");
        Require(config, "REDIS_URL");
        Require(config, "JWT_SECRET");
        Require(config, "FRONTEND_URL");
        Require(config, "STRIPE_SECRET_KEY");
    }

    // ── Stripe — global API key, set once at startup ─────────────────────────
    Stripe.StripeConfiguration.ApiKey =
        config["STRIPE_SECRET_KEY"]
        ?? throw new InvalidOperationException(
            "STRIPE_SECRET_KEY environment variable is not defined."
        );

    // ── Twilio — global client initialization, set once at startup ───────────
    var twilioSid = config["TWILIO_ACCOUNT_SID"];
    var twilioToken = config["TWILIO_AUTH_TOKEN"];
    if (!string.IsNullOrEmpty(twilioSid) && !string.IsNullOrEmpty(twilioToken))
        Twilio.TwilioClient.Init(twilioSid, twilioToken);

    // ── Kestrel / Form upload limits ─────────────────────────────────────────
    // Default ASP.NET Core multipart limit is 128 MB — dangerously large for a
    // marketplace where only product images (≤ 5 MB) are expected.
    builder.WebHost.ConfigureKestrel(k =>
    {
        // Max request body: 6 MB (5 MB file + overhead for form fields)
        k.Limits.MaxRequestBodySize = 6 * 1024 * 1024;
    });

    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    {
        o.MultipartBodyLengthLimit = 6 * 1024 * 1024; // 6 MB
        o.ValueLengthLimit         = 1024 * 1024;      // 1 MB for non-file values
    });

    // ── PostgreSQL + EF Core ──────────────────────────────────────────────────
    var npgsqlConn = ToNpgsql(config["DATABASE_URL"]!, builder.Environment.IsDevelopment());
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(npgsqlConn)
            .ConfigureWarnings(w =>
                w.Ignore(
                    Microsoft
                        .EntityFrameworkCore
                        .Diagnostics
                        .RelationalEventId
                        .PendingModelChangesWarning
                )
            )
    );

    // ── Redis Cache ───────────────────────────────────────────────────────────
    var redisConn = ToRedis(config["REDIS_URL"]!);
    builder.Services.AddStackExchangeRedisCache(opt => opt.Configuration = redisConn);
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
        ConnectionMultiplexer.Connect(redisConn)
    );

    // ── JWT Bearer ────────────────────────────────────────────────────────────
    builder
        .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(config["JWT_SECRET"]!)
                ),
                ValidateIssuer = true,
                ValidIssuer = config["JWT_ISSUER"],
                ValidateAudience = true,
                ValidAudience = config["JWT_AUDIENCE"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            };

            opt.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var accessToken = ctx.Request.Query["access_token"];
                    var path = ctx.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        ctx.Token = accessToken;
                    return Task.CompletedTask;
                },
            };
        });

    // ── RBAC Policies ─────────────────────────────────────────────────────────
    builder.Services.AddAuthorization(opt =>
    {
        opt.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
        opt.AddPolicy("MerchantOnly", p => p.RequireRole("Merchant"));
        opt.AddPolicy("CourierOnly", p => p.RequireRole("Courier"));
        opt.AddPolicy("CustomerOnly", p => p.RequireRole("Customer"));
        opt.AddPolicy("AdminOrMerchant", p => p.RequireRole("Admin", "Merchant"));
        opt.AddPolicy("AdminOrCourier", p => p.RequireRole("Admin", "Courier")); // ← EKLE
    });

    // ── Health Checks ─────────────────────────────────────────────────────────
    // AspNetCore.HealthChecks.NpgSql  → extension method: AddNpgSql  (capital S)
    // AspNetCore.HealthChecks.Redis   → extension method: AddRedis
    // Positional args used to avoid named-parameter mismatches across patch versions.
    // AddNpgSql signature: (connectionString, healthQuery, configure, name, failureStatus, tags, timeout)
    // AddRedis  signature: (connectionString, name, failureStatus, tags, timeout)
    builder.Services
        .AddHealthChecks()
        .AddNpgSql(
            npgsqlConn,
            "SELECT 1;",
            null,
            "postgres",
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy,
            ["db", "sql", "postgres"])
        .AddRedis(
            redisConn,
            "redis",
            Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded,
            ["cache", "redis"]);

    // ── MediatR ───────────────────────────────────────────────────────────────
    builder.Services.AddMediatR(cfg =>
    {
        cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        // Validation: fires FluentValidation validators on every Send()
        cfg.AddOpenBehavior(typeof(api.Application.Behaviours.ValidationBehaviour<,>));
        // Cache invalidation: after commands implementing IInvalidatesCache succeed, Redis keys are deleted
        cfg.AddOpenBehavior(typeof(api.Application.Behaviours.CacheInvalidationBehaviour<,>));
        // Stock reservation: Redis distributed lock wraps CreateOrderCommand to prevent overselling
        cfg.AddBehavior(typeof(api.Application.Behaviours.StockReservationBehaviour));
    });

    // ── AutoMapper ────────────────────────────────────────────────────────────
    builder.Services.AddAutoMapper(cfg => cfg.AddMaps(AppDomain.CurrentDomain.GetAssemblies()));

    // ── FluentValidation ──────────────────────────────────────────────────────
    builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

    // ── Hangfire ──────────────────────────────────────────────────────────────
    builder.Services.AddHangfire(c =>
        c.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(o => o.UseNpgsqlConnection(npgsqlConn))
    );
    builder.Services.AddHangfireServer();

    // ── SignalR ───────────────────────────────────────────────────────────────
    builder
        .Services.AddSignalR()
        .AddStackExchangeRedis(
            redisConn,
            options =>
            {
                options.Configuration.ChannelPrefix = RedisChannel.Literal("marketplace");
            }
        );

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(opt =>
    {
        opt.EnableEndpointRateLimiting = true;
        opt.StackBlockedRequests       = false;
        opt.HttpStatusCode             = 429;
        opt.RealIpHeader               = "X-Real-IP";   // honour reverse-proxy header
        opt.ClientIdHeader             = "X-Client-ID";

        opt.GeneralRules = new List<RateLimitRule>
        {
            // ── High-sensitivity: authentication + account creation ─────────────
            // Brute-force / credential-stuffing protection.
            new() { Endpoint = "POST:/api/auth/login",            Period = "1m",  Limit = 5   },
            new() { Endpoint = "POST:/api/auth/login",            Period = "15m", Limit = 15  },
            new() { Endpoint = "POST:/api/auth/register",         Period = "1h",  Limit = 5   },
            new() { Endpoint = "POST:/api/auth/forgot-password",  Period = "1h",  Limit = 5   },
            new() { Endpoint = "POST:/api/auth/reset-password",   Period = "1h",  Limit = 5   },
            new() { Endpoint = "POST:/api/auth/refresh",          Period = "1m",  Limit = 10  },

            // ── Financial endpoints: stricter limits to prevent fraud loops ─────
            new() { Endpoint = "POST:/api/payments/checkout",     Period = "1m",  Limit = 5   },
            new() { Endpoint = "POST:/api/payments/confirm",      Period = "1m",  Limit = 5   },
            new() { Endpoint = "POST:/api/orders",                Period = "1m",  Limit = 5   },

            // ── Communication: prevent email/SMS bombing ───────────────────────
            new() { Endpoint = "POST:/api/notifications/*",       Period = "1m",  Limit = 5   },

            // ── Product / search: moderate limits for scraping prevention ──────
            new() { Endpoint = "GET:/api/products*",              Period = "1m",  Limit = 60  },
            new() { Endpoint = "GET:/api/products/search*",       Period = "1m",  Limit = 30  },

            // ── Global fallback ────────────────────────────────────────────────
            new() { Endpoint = "*",                               Period = "1m",  Limit = 120 },
        };
    });
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // ── CORS ─────────────────────────────────────────────────────────────────
    builder.Services.AddCors(opt =>
        opt.AddPolicy(
            "Frontend",
            p =>
            {
                if (builder.Environment.IsDevelopment())
                {
                    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
                }
                else
                {
                    var frontendOrigin =
                        config["FRONTEND_URL"]
                        ?? throw new InvalidOperationException(
                            "FRONTEND_URL environment variable is not defined in the production environment."
                        );
                    p.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod();
                }
            }
        )
    );

    // ── Application Services ──────────────────────────────────────────────────
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IFulfillmentService, FulfillmentService>();
    builder.Services.AddScoped<IShippingCalculatorService, ShippingCalculatorService>();
    builder.Services.AddScoped<IStockReservationService, StockReservationService>();
    builder.Services.AddScoped<ILabelGeneratorService, LabelGeneratorService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<ICourierService, CourierService>();
    builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
    builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
    builder.Services.AddScoped<IInvoiceGeneratorService, InvoiceGeneratorService>();
    // Module 2: Wallet & Escrow
    builder.Services.AddScoped<IWalletService, WalletService>();
    builder.Services.AddScoped<ICommissionService, CommissionService>();
    builder.Services.AddScoped<ISubscriptionGuard, SubscriptionGuard>();
    builder.Services.AddTransient<DataExportJob>();
    builder.Services.AddTransient<AccountPurgeJob>();

    // ── Milestone 2: Webhook Service ─────────────────────────────────────────
    builder.Services.AddHttpClient("webhook");
    builder.Services.AddScoped<
        api.Infrastructure.Webhooks.IWebhookService,
        api.Infrastructure.Webhooks.WebhookService
    >();

    // ── Hangfire Jobs ─────────────────────────────────────────────────────────
    builder.Services.AddTransient<OrderStatusJob>();
    builder.Services.AddTransient<NotificationJob>();
    builder.Services.AddTransient<DelayedShipmentJob>();
    builder.Services.AddTransient<ShipmentStatusSyncJob>();
    builder.Services.AddTransient<EscrowSettlementJob>(); // Module 2: wallet settlement
    builder.Services.AddTransient<CourierDispatchJob>(); // Module 4: geo dispatch
    builder.Services.AddTransient<PostPaymentSideEffectsJob>(); // Outbox: invoice + notification

    // ── Controllers + Swagger ─────────────────────────────────────────────────
    builder
        .Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = System
                .Text
                .Json
                .Serialization
                .ReferenceHandler
                .IgnoreCycles;
            options.JsonSerializerOptions.PropertyNamingPolicy = System
                .Text
                .Json
                .JsonNamingPolicy
                .CamelCase;
            // Serialize enums as SCREAMING_SNAKE_CASE strings (matches frontend TypeScript union types).
            // Applies to enum-typed properties in anonymous objects and DTOs that don't call .ToString() manually.
            options.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter(ScreamingSnakeCaseNamingPolicy.Instance)
            );
        });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc(
            "v1",
            new OpenApiInfo
            {
                Title = "Marketplace & Fulfillment API",
                Version = "v1",
                Description = "Multi-tenant e-commerce marketplace + fulfillment platform",
            }
        );

        c.AddSecurityDefinition(
            "Bearer",
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Enter JWT token",
            }
        );

        c.AddSecurityRequirement(
            new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer",
                        },
                    },
                    Array.Empty<string>()
                },
            }
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    var app = builder.Build();
    // ─────────────────────────────────────────────────────────────────────────

    // ── Migrate + Seed ────────────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            if (app.Environment.IsDevelopment())
            {
                // Development: auto-migrate on startup for convenience.
                await db.Database.MigrateAsync();
                logger.LogInformation("Database migration completed (development).");
            }
            else
            {
                // Production: NEVER auto-migrate at startup.
                //
                // Reasons:
                //  1. Rolling deployments — multiple pods starting simultaneously
                //     will race on the same migration, causing lock conflicts.
                //  2. Long-running migrations can lock hot tables and cause downtime.
                //  3. Migrations should be reviewed and applied as a deliberate CI/CD
                //     step, not silently on every cold start.
                //
                // Recommended production strategy:
                //  - Generate a SQL script: `dotnet ef migrations script --idempotent`
                //  - Apply the script in your CI/CD pipeline against the live DB
                //    BEFORE deploying the new application image.
                //  - Alternatively run a dedicated "migration job" container that
                //    runs `dotnet ef database update` once before the main fleet starts.
                //
                // We still verify connectivity so the app fails fast if the DB
                // is unreachable rather than crashing on the first request.
                var pendingMigrations = (await db.Database.GetPendingMigrationsAsync()).ToList();
                if (pendingMigrations.Count > 0)
                {
                    logger.LogError(
                        "STARTUP BLOCKED — {Count} pending migration(s) detected in production: {Migrations}. " +
                        "Apply migrations via the CI/CD pipeline before deploying this image.",
                        pendingMigrations.Count,
                        string.Join(", ", pendingMigrations));
                    throw new InvalidOperationException(
                        $"Production startup blocked: {pendingMigrations.Count} pending EF migrations. " +
                        "Run `dotnet ef migrations script --idempotent` and apply via CI/CD.");
                }

                logger.LogInformation("Database schema is up to date. No pending migrations.");
            }
        }
        catch (InvalidOperationException)
        {
            throw; // propagate the startup-block exception above
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Database connectivity check failed at startup.");
            throw;
        }

        await DataSeeder.SeedAsync(db);
    }

    // ── Global ValidationException → 400 Bad Request ─────────────────────────
    // FluentValidation pipeline behavior tarafından fırlatılan ValidationException'ları
    // standart 400 yanıtına dönüştürür.
    app.Use(
        async (ctx, next) =>
        {
            try
            {
                await next();
            }
            catch (FluentValidation.ValidationException ex)
            {
                ctx.Response.StatusCode = 400;
                ctx.Response.ContentType = "application/json";
                var errors = ex.Errors.Select(e => new
                {
                    field = e.PropertyName,
                    message = e.ErrorMessage,
                });
                await ctx.Response.WriteAsJsonAsync(new { success = false, errors });
            }
        }
    );

    // ── Middleware Pipeline ───────────────────────────────────────────────────

    // [KRİTİK] Global exception handler must be FIRST to catch all downstream exceptions.
    app.UseGlobalExceptionHandler();

    // [KRİTİK] Swagger must NEVER be exposed in production.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Marketplace API v1"));
    }

    if (!app.Environment.IsDevelopment())
        app.UseHsts();

    app.UseHttpsRedirection();
    app.UseSerilogRequestLogging();
    app.UseIpRateLimiting();
    app.UseCors("Frontend");
    app.UseCustomDomain(); // Milestone 2: custom domain → merchant slug resolution
    app.UseAuthentication();
    app.UseAuthorization();
    // Module 5: idempotency key deduplication on critical POST endpoints
    app.UseIdempotency();

    app.MapControllers();
    app.MapHub<TrackingHub>("/hubs/tracking");

    // ── Health Check endpoints ────────────────────────────────────────────────
    // /health        → liveness probe (used by Docker/K8s/load balancer)
    // /health/ready  → readiness probe (only healthy when DB + Redis are reachable)
    app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        // Liveness: always returns 200 if the process is running, regardless of dependencies.
        Predicate = _ => false,
        ResponseWriter = async (ctx, _) =>
        {
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(
                System.Text.Json.JsonSerializer.Serialize(new { status = "alive", timestamp = DateTime.UtcNow }));
        },
    });

    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        // Readiness: checks all registered dependencies (postgres + redis).
        Predicate = _ => true,
        ResponseWriter = async (ctx, report) =>
        {
            ctx.Response.ContentType = "application/json";
            var result = new
            {
                status    = report.Status.ToString(),
                timestamp = DateTime.UtcNow,
                checks    = report.Entries.Select(e => new
                {
                    name     = e.Key,
                    status   = e.Value.Status.ToString(),
                    duration = e.Value.Duration.TotalMilliseconds,
                    error    = e.Value.Exception?.Message,
                }),
            };
            ctx.Response.StatusCode = report.Status ==
                Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy ? 200 : 503;
            await ctx.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(result));
        },
    });
    app.MapHangfireDashboard(
        "/hangfire",
        new DashboardOptions { Authorization = new[] { new HangfireAdminAuthFilter() } }
    );

    // ── Recurring Jobs ────────────────────────────────────────────────────────
    RecurringJob.AddOrUpdate<OrderStatusJob>(
        "check-overdue-shipments",
        job => job.RunAsync(),
        "*/5 * * * *"
    );

    RecurringJob.AddOrUpdate<NotificationJob>(
        "process-pending-notifications",
        job => job.RunAsync(),
        "* * * * *"
    );

    RecurringJob.AddOrUpdate<DelayedShipmentJob>(
        "check-delayed-shipments",
        job => job.RunAsync(),
        "0 * * * *" // every hour
    );

    RecurringJob.AddOrUpdate<ShipmentStatusSyncJob>(
        "sync-shipment-statuses",
        job => job.RunAsync(),
        "*/30 * * * *" // every 30 minutes
    );

    // Module 2: settle escrow daily at 02:00 UTC
    RecurringJob.AddOrUpdate<EscrowSettlementJob>(
        "escrow-settlement",
        job => job.RunAsync(),
        "0 2 * * *"
    );

    // Module 4: auto-dispatch couriers every 2 minutes
    RecurringJob.AddOrUpdate<CourierDispatchJob>(
        "courier-auto-dispatch",
        job => job.RunAsync(),
        "*/2 * * * *"
    );

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application startup failed");
}
finally
{
    Log.CloseAndFlush();
}
