using System.Net;
using System.Text.Json;

namespace api.Infrastructure.Middleware;

/// <summary>
/// Last-resort exception handler.
/// Catches every unhandled exception before it reaches the Kestrel transport layer,
/// returns a structured JSON problem response, and logs the full exception server-side
/// without leaking stack traces or internal details to the client.
///
/// Registration order in Program.cs: must be the FIRST middleware so it wraps
/// all subsequent middleware and controllers.
///   app.UseGlobalExceptionHandler();
///   app.UseHttpsRedirection();
///   ... rest of pipeline ...
/// </summary>
public sealed class GlobalExceptionMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger,
    IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(ctx, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext ctx, Exception ex)
    {
        // Always log the full exception server-side.
        // Sensitive fields (passwords, cards) are never in our exceptions because
        // we never bind them to strings — but correlation ID helps trace production issues.
        var correlationId = ctx.TraceIdentifier;

        logger.LogError(
            ex,
            "Unhandled exception [{CorrelationId}] {Method} {Path}: {Message}",
            correlationId,
            ctx.Request.Method,
            ctx.Request.Path,
            ex.Message);

        var (statusCode, title) = ex switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,       "Unauthorized"),
            KeyNotFoundException        => (HttpStatusCode.NotFound,           "Not found"),
            ArgumentException           => (HttpStatusCode.BadRequest,         "Bad request"),
            InvalidOperationException   => (HttpStatusCode.UnprocessableEntity,"Business rule violation"),
            TimeoutException            => (HttpStatusCode.GatewayTimeout,     "Request timed out"),
            _                           => (HttpStatusCode.InternalServerError,"An unexpected error occurred"),
        };

        ctx.Response.StatusCode  = (int)statusCode;
        ctx.Response.ContentType = "application/problem+json";

        var problem = new
        {
            type          = $"https://httpstatuses.io/{(int)statusCode}",
            title,
            status        = (int)statusCode,
            correlationId,
            // Detail is only included in Development to avoid leaking internals.
            detail = env.IsDevelopment() ? ex.Message : null,
        };

        await ctx.Response.WriteAsync(
            JsonSerializer.Serialize(problem, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            }));
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionMiddleware>();
}
