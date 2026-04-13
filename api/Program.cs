using System.Reflection;
using System.Text;
using api.Infrastructure.Hubs;
using api.Infrastructure.Jobs;
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

// ── Serilog Bootstrap Logger ─────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    var config = builder.Configuration;

    // ── Serilog (full) ────────────────────────────────────────────────────────
    builder.Host.UseSerilog(
        (ctx, lc) =>
            lc.ReadFrom.Configuration(ctx.Configuration).Enrich.FromLogContext().WriteTo.Console()
    );

    // ── Database — PostgreSQL + EF Core ──────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(config["DATABASE_URL"]));

    // ── Redis Cache ───────────────────────────────────────────────────────────
    builder.Services.AddStackExchangeRedisCache(opt => opt.Configuration = config["REDIS_URL"]);

    // Bare Redis multiplexer (used by SignalR backplane & BuyBoxService)
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
        ConnectionMultiplexer.Connect(config["REDIS_URL"]!)
    );

    // ── Authentication — JWT Bearer ───────────────────────────────────────────
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

            // SignalR: JWT token query-string fallback
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

    // ── Authorization — RBAC Policies ────────────────────────────────────────
    builder.Services.AddAuthorization(opt =>
    {
        opt.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
        opt.AddPolicy("MerchantOnly", p => p.RequireRole("Merchant"));
        opt.AddPolicy("CourierOnly", p => p.RequireRole("Courier"));
        opt.AddPolicy("CustomerOnly", p => p.RequireRole("Customer"));
        opt.AddPolicy("AdminOrMerchant", p => p.RequireRole("Admin", "Merchant"));
    });

    // ── MediatR — CQRS ───────────────────────────────────────────────────────
    builder.Services.AddMediatR(cfg =>
        cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly())
    );

    // ── AutoMapper ────────────────────────────────────────────────────────────
    builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

    // ── FluentValidation ──────────────────────────────────────────────────────
    builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
    builder.Services.AddFluentValidationAutoValidation();

    // ── Hangfire — Background Jobs (PostgreSQL storage) ───────────────────────
    builder.Services.AddHangfire(c =>
        c.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(o => o.UseNpgsqlConnection(config["DATABASE_URL"]))
    );

    builder.Services.AddHangfireServer();

    // ── SignalR — Real-time Tracking ─────────────────────────────────────────
    // Redis backplane: comment out the .AddStackExchangeRedis(...) call
    // for single-server deployments and re-enable for multi-node scale-out.
    builder.Services.AddSignalR()
        // .AddStackExchangeRedis(config["REDIS_URL"]!)
    ;

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(opt =>
    {
        opt.EnableEndpointRateLimiting = true;
        opt.StackBlockedRequests = false;
        opt.GeneralRules = new List<RateLimitRule>
        {
            new()
            {
                Endpoint = "*:/api/auth/*",
                Period = "1m",
                Limit = 10,
            },
            new()
            {
                Endpoint = "*",
                Period = "1m",
                Limit = 100,
            },
        };
    });
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // ── CORS — Next.js Frontend ───────────────────────────────────────────────
    builder.Services.AddCors(opt =>
        opt.AddPolicy(
            "Frontend",
            p =>
                p.WithOrigins(config["FRONTEND_URL"]!)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
        )
    );

    // ── Application Services (DI) ─────────────────────────────────────────────
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IFulfillmentService, FulfillmentService>();
    builder.Services.AddScoped<IShippingCalculatorService, ShippingCalculatorService>();
    builder.Services.AddScoped<ILabelGeneratorService, LabelGeneratorService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IBuyBoxService, BuyBoxService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();

    // ── Hangfire Jobs (transient — Hangfire resolves per execution) ───────────
    builder.Services.AddTransient<OrderStatusJob>();
    builder.Services.AddTransient<NotificationJob>();

    // ── Controllers + Swagger ─────────────────────────────────────────────────
    builder.Services.AddControllers();
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

    // ── Auto-migrate + seed on startup ───────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await DataSeeder.SeedAsync(db);
    }

    // ── Middleware Pipeline ───────────────────────────────────────────────────
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Marketplace API v1"));
    }
    else
    {
        // Swagger also available in production (password-protect via Nginx if needed)
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Marketplace API v1"));

        app.UseHsts();
    }

    app.UseHttpsRedirection();
    app.UseSerilogRequestLogging();
    app.UseIpRateLimiting();
    app.UseCors("Frontend");

    app.UseAuthentication();
    app.UseAuthorization();

    // ── Controllers ───────────────────────────────────────────────────────────
    app.MapControllers();

    // ── SignalR Hub ───────────────────────────────────────────────────────────
    app.MapHub<TrackingHub>("/hubs/tracking");

    // ── Hangfire Dashboard (Admin only) ──────────────────────────────────────
    app.MapHangfireDashboard(
        "/hangfire",
        new DashboardOptions { Authorization = new[] { new HangfireAdminAuthFilter() } }
    );

    // ── Recurring Jobs ────────────────────────────────────────────────────────
    RecurringJob.AddOrUpdate<OrderStatusJob>(
        "check-overdue-shipments",
        job => job.RunAsync(),
        "*/5 * * * *"
    ); // every 5 minutes

    RecurringJob.AddOrUpdate<NotificationJob>(
        "process-pending-notifications",
        job => job.RunAsync(),
        "* * * * *"
    ); // every minute

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
