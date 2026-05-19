using System.Text;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Infrastructure.Middleware;

/// <summary>
/// Prevents duplicate processing of critical POST requests by caching responses
/// keyed on the X-Idempotency-Key header for 24 hours.
///
/// Applicable endpoints (registered in Program.cs):
///   POST /api/payments/checkout
///   POST /api/payments/confirm
///   POST /api/orders
///
/// If the same key is seen again within the TTL, the cached response body is
/// returned immediately with the original status code and Content-Type.
/// </summary>
public class IdempotencyMiddleware
{
    private static readonly HashSet<string> CoveredPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/payments/checkout",
        "/api/payments/confirm",
        "/api/orders",
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<IdempotencyMiddleware> _logger;

    public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext ctx, IDistributedCache cache)
    {
        // Only intercept POST requests on covered paths
        if (!HttpMethods.IsPost(ctx.Request.Method) ||
            !CoveredPaths.Any(p => ctx.Request.Path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(ctx);
            return;
        }

        var idempotencyKey = ctx.Request.Headers["X-Idempotency-Key"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            // No key provided — pass through without caching
            await _next(ctx);
            return;
        }

        var cacheKey = $"idempotency:{idempotencyKey}";

        // ── Check for existing cached response ───────────────────────────────
        var cached = await cache.GetAsync(cacheKey);
        if (cached != null)
        {
            var payload = IdempotencyPayload.Deserialize(cached);
            _logger.LogInformation(
                "Idempotency hit: key={Key} path={Path}", idempotencyKey, ctx.Request.Path);

            ctx.Response.StatusCode = payload.StatusCode;
            ctx.Response.ContentType = payload.ContentType;
            await ctx.Response.WriteAsync(payload.Body);
            return;
        }

        // ── Capture response body ────────────────────────────────────────────
        var originalBody = ctx.Response.Body;
        using var buffer = new MemoryStream();
        ctx.Response.Body = buffer;

        try
        {
            await _next(ctx);
        }
        finally
        {
            buffer.Position = 0;
            var responseBody = await new StreamReader(buffer).ReadToEndAsync();

            // Only cache 2xx responses
            if (ctx.Response.StatusCode is >= 200 and < 300)
            {
                var payload = new IdempotencyPayload(
                    ctx.Response.StatusCode,
                    ctx.Response.ContentType ?? "application/json",
                    responseBody
                );

                await cache.SetAsync(
                    cacheKey,
                    payload.Serialize(),
                    new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24),
                    });

                _logger.LogDebug(
                    "Idempotency cached: key={Key} status={Status}", idempotencyKey, ctx.Response.StatusCode);
            }

            // Write buffered response to actual client
            buffer.Position = 0;
            ctx.Response.Body = originalBody;
            await buffer.CopyToAsync(originalBody);
        }
    }
}

internal record IdempotencyPayload(int StatusCode, string ContentType, string Body)
{
    public byte[] Serialize()
    {
        var json = System.Text.Json.JsonSerializer.Serialize(this);
        return Encoding.UTF8.GetBytes(json);
    }

    public static IdempotencyPayload Deserialize(byte[] data)
    {
        var json = Encoding.UTF8.GetString(data);
        return System.Text.Json.JsonSerializer.Deserialize<IdempotencyPayload>(json)!;
    }
}

public static class IdempotencyMiddlewareExtensions
{
    public static IApplicationBuilder UseIdempotency(this IApplicationBuilder app)
        => app.UseMiddleware<IdempotencyMiddleware>();
}
