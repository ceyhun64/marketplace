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

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();

// ── Helper: postgresql:// URL → Npgsql connection string ─────────────────────
static string ToNpgsql(string url)
{
    var uri = new Uri(url);
    var userInfo = uri.UserInfo.Split(':');
    var host = uri.Host;
    var port = uri.Port > 0 ? uri.Port : 5432;
    var db = uri.AbsolutePath.TrimStart('/');
    var user = userInfo[0];
    var pass = userInfo.Length > 1 ? userInfo[1] : "";
    return $"Host={host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
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

    // ── Serilog ───────────────────────────────────────────────────────────────
    builder.Host.UseSerilog(
        (ctx, lc) =>
            lc.ReadFrom.Configuration(ctx.Configuration).Enrich.FromLogContext().WriteTo.Console()
    );

    // ── PostgreSQL + EF Core ──────────────────────────────────────────────────
    var npgsqlConn = ToNpgsql(config["DATABASE_URL"]!);
    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(npgsqlConn));

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
    });

    // ── MediatR ───────────────────────────────────────────────────────────────
    builder.Services.AddMediatR(cfg =>
        cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly())
    );

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
    builder.Services.AddSignalR();

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

    // ── CORS — geliştirme aşaması: tüm originlere izin ver ───────────────────
    builder.Services.AddCors(opt =>
        opt.AddPolicy("Frontend", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod())
    );

    // ── Application Services ──────────────────────────────────────────────────
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IFulfillmentService, FulfillmentService>();
    builder.Services.AddScoped<IShippingCalculatorService, ShippingCalculatorService>();
    builder.Services.AddScoped<ILabelGeneratorService, LabelGeneratorService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IBuyBoxService, BuyBoxService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();

    // ── Hangfire Jobs ─────────────────────────────────────────────────────────
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

    // ── Migrate + Seed ────────────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await DataSeeder.SeedAsync(db);
    }

    // ── Middleware Pipeline ───────────────────────────────────────────────────
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Marketplace API v1"));

    if (!app.Environment.IsDevelopment())
        app.UseHsts();

    app.UseHttpsRedirection();
    app.UseSerilogRequestLogging();
    app.UseIpRateLimiting();
    app.UseCors("Frontend");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<TrackingHub>("/hubs/tracking");
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
