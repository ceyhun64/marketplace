using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Middleware;

/// <summary>
/// Gelen HTTP isteğinin Host header'ını okur ve bunu merchant slug'ına çevirir.
/// Merchant'ın özel domain'i (mymağaza.com) veya subdomain'i (mağaza.platform.com)
/// kullanıldığında, ilgili merchant'ı tespit edip HttpContext.Items'a yazar.
/// StoreController bu değeri okuyarak doğru mağazayı döner.
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

        // Localhost ve bilinen platform subdomainleri için atla
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
                // Önce özel domain eşleşmesine bak (mymağaza.com)
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
                    // Subdomain kontrolü: mağaza.platform.com → slug = mağaza
                    // Host'u noktalara böl; ilk parça potansiyel slug
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
                // DB hatası durumunda isteği kesme, devam et
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
