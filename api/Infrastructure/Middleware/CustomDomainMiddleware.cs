using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Middleware;

/// <summary>
/// Reads the Host header of the incoming HTTP request and resolves it to a merchant slug.
/// When a merchant's custom domain (mystore.com) or subdomain (store.platform.com) is used,
/// identifies the relevant merchant and writes it to HttpContext.Items.
/// StoreController reads this value to return the correct store.
/// </summary>
public class CustomDomainMiddleware
{
    private readonly RequestDelegate _next;

    public CustomDomainMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        var host = context.Request.Host.Host;

        // Skip for localhost and known platform subdomains
        if (
            !string.IsNullOrEmpty(host)
            && !host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            && !host.Contains("127.0.0.1")
            && !host.EndsWith(".railway.app", StringComparison.OrdinalIgnoreCase)
            && !host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)
        )
        {
            try
            {
                // First check for a custom domain match (mystore.com)
                var merchantByDomain = await db
                    .MerchantProfiles.AsNoTracking()
                    .Where(m => m.IsActive && m.DomainVerified && m.CustomDomain == host)
                    .Select(m => new { m.Id, m.Slug })
                    .FirstOrDefaultAsync();

                if (merchantByDomain != null)
                {
                    context.Items["MerchantSlug"] = merchantByDomain.Slug;
                    context.Items["MerchantId"] = merchantByDomain.Id;
                }
                else
                {
                    // Subdomain check: store.platform.com → slug = store
                    // Split the host by dots; the first part is the potential slug
                    var parts = host.Split('.');
                    if (parts.Length >= 3)
                    {
                        var subdomain = parts[0];
                        var merchantBySlug = await db
                            .MerchantProfiles.AsNoTracking()
                            .Where(m => m.IsActive && m.Slug == subdomain)
                            .Select(m => new { m.Id, m.Slug })
                            .FirstOrDefaultAsync();

                        if (merchantBySlug != null)
                        {
                            context.Items["MerchantSlug"] = merchantBySlug.Slug;
                            context.Items["MerchantId"] = merchantBySlug.Id;
                        }
                    }
                }
            }
            catch
            {
                // Do not interrupt the request on DB error, continue
            }
        }

        await _next(context);
    }
}

// Extension method for clean registration in Program.cs
public static class CustomDomainMiddlewareExtensions
{
    public static IApplicationBuilder UseCustomDomain(this IApplicationBuilder builder) =>
        builder.UseMiddleware<CustomDomainMiddleware>();
}
