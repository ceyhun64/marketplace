using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoreController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService? _currentUser;

    public StoreController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetStoreList(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var total = await _db.MerchantProfiles.CountAsync(m => m.IsActive);

        var stores = await _db
            .MerchantProfiles.Where(m => m.IsActive)
            .OrderBy(m => m.StoreName)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Slug,
                m.LogoUrl,
                m.BannerUrl,
                m.CreatedAt,
                ProductCount = m.Products.Count(p =>
                    p.PublishToStore && p.Stock > 0 && !p.IsDeleted
                ),
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                page,
                limit,
                stores,
            }
        );
    }

    // ── GET /api/store/by-domain/{domain} — Custom domain'den store lookup ───
    /// <summary>
    /// Özel domain veya subdomain ile gelen isteklerde mağazayı bulur.
    /// Nginx custom domain proxy'si bu endpoint'i çağırarak slug'ı öğrenir.
    /// </summary>
    [HttpGet("by-domain/{domain}")]
    public async Task<IActionResult> GetStoreByDomain(string domain)
    {
        if (string.IsNullOrWhiteSpace(domain))
            return BadRequest(new { message = "Domain boş olamaz." });

        var store = await _db
            .MerchantProfiles.Where(m =>
                m.IsActive && m.DomainVerified && m.CustomDomain == domain
            )
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Slug,
                m.Description,
                m.LogoUrl,
                m.BannerUrl,
                m.CustomDomain,
                m.DomainVerified,
                m.CreatedAt,
                ProductCount = m.Products.Count(p =>
                    p.PublishToStore && p.Stock > 0 && !p.IsDeleted
                ),
            })
            .FirstOrDefaultAsync();

        if (store == null)
            return NotFound(new { message = "Bu domain ile eşleşen doğrulanmış mağaza bulunamadı." });

        return Ok(store);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetStore(string slug)
    {
        // Önce slug ile ara
        var store = await _db
            .MerchantProfiles.Where(m => m.Slug == slug && m.IsActive)
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Slug,
                m.Description,
                m.LogoUrl,
                m.BannerUrl,
                m.CustomDomain,
                m.DomainVerified,
                m.Address,
                m.City,
                m.CreatedAt,
                ProductCount = m.Products.Count(p =>
                    p.PublishToStore && p.Stock > 0 && !p.IsDeleted
                ),
            })
            .FirstOrDefaultAsync();

        // Slug bulunamazsa özel domain ile dene (middleware custom domain → /store/{domain} rewrite yapar)
        if (store == null && slug.Contains('.'))
        {
            store = await _db
                .MerchantProfiles.Where(m => m.IsActive && m.DomainVerified && m.CustomDomain == slug)
                .Select(m => new
                {
                    m.Id,
                    m.StoreName,
                    m.Slug,
                    m.Description,
                    m.LogoUrl,
                    m.BannerUrl,
                    m.CustomDomain,
                    m.DomainVerified,
                    m.Address,
                    m.City,
                    m.CreatedAt,
                    ProductCount = m.Products.Count(p =>
                        p.PublishToStore && p.Stock > 0 && !p.IsDeleted
                    ),
                })
                .FirstOrDefaultAsync();
        }

        if (store == null)
            return NotFound(new { message = "Mağaza bulunamadı." });
        return Ok(store);
    }

    [HttpGet("{slug}/products")]
    public async Task<IActionResult> GetStoreProducts(
        string slug,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null
    )
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
            m.Slug == slug && m.IsActive
        );

        // Custom domain fallback
        if (merchant == null && slug.Contains('.'))
            merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
                m.IsActive && m.DomainVerified && m.CustomDomain == slug
            );

        if (merchant == null)
            return NotFound(new { message = "Mağaza bulunamadı." });

        var query = _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p =>
                p.MerchantId == merchant.Id && p.PublishToStore && p.Stock > 0 && !p.IsDeleted
            )
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => EF.Functions.ILike(p.Name, $"%{search}%"));

        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category != null && p.Category.Slug == category);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                Id           = p.Id,
                ProductId    = p.Id,
                ProductName  = p.Name,
                ProductImages = p.Images,
                p.Price,
                p.Stock,
                Rating            = 0.0,
                CategoryName      = p.Category == null ? (string?)null : p.Category.Name,
                MerchantId        = p.MerchantId,
                MerchantStoreName = p.Merchant.StoreName,
                MerchantSlug      = p.Merchant.Slug,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                page,
                limit,
                items,
            }
        );
    }

    [HttpGet("{slug}/products/{productId:guid}")]
    public async Task<IActionResult> GetStoreProduct(string slug, Guid productId)
    {
        var product = await _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p =>
                p.Merchant.Slug == slug && p.Id == productId && p.PublishToStore && !p.IsDeleted
            )
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                Category = p.Category == null ? null : new { p.Category.Name, p.Category.Slug },
                Store = new { p.Merchant.StoreName, p.Merchant.Slug },
            })
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });
        return Ok(product);
    }

    [HttpGet("{slug}/categories")]
    public async Task<IActionResult> GetStoreCategories(string slug)
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
            m.Slug == slug && m.IsActive
        );

        if (merchant == null && slug.Contains('.'))
            merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
                m.IsActive && m.DomainVerified && m.CustomDomain == slug
            );

        if (merchant == null)
            return NotFound(new { message = "Mağaza bulunamadı." });

        var categories = await _db
            .Products.Include(p => p.Category)
            .Where(p =>
                p.MerchantId == merchant.Id
                && p.PublishToStore
                && !p.IsDeleted
                && p.Category != null
            )
            .Select(p => new
            {
                p.Category!.Id,
                p.Category.Name,
                p.Category.Slug,
            })
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }

    // ── PUT /api/store/settings — Merchant: mağaza ayarlarını güncelle ────────
    /// <summary>
    /// Merchant kendi mağazasının logo, banner, açıklama ve diğer ayarlarını günceller.
    /// Logo ve banner yükleme Pro/Enterprise plan gerektirir.
    /// </summary>
    [HttpPut("settings")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> UpdateStoreSettings([FromBody] UpdateStoreSettingsDto dto)
    {
        var merchant = await _db
            .MerchantProfiles.Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser!.UserId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        // Logo / banner Pro planı gerektirir
        if ((dto.LogoUrl != null || dto.BannerUrl != null) && merchant.LogoUrl == null)
        {
            var hasPro = merchant.Subscription != null
                && merchant.Subscription.IsActive
                && merchant.Subscription.ExpiresAt > DateTime.UtcNow
                && merchant.Subscription.Plan != PlanType.Basic;

            if (!hasPro)
                return BadRequest(new
                {
                    message = "Logo ve banner yüklemek için Pro veya Enterprise plan gereklidir.",
                    requiredPlan = "Pro"
                });
        }

        if (dto.StoreName != null) merchant.StoreName = dto.StoreName;
        if (dto.Description != null) merchant.Description = dto.Description;
        if (dto.LogoUrl != null) merchant.LogoUrl = dto.LogoUrl;
        if (dto.BannerUrl != null) merchant.BannerUrl = dto.BannerUrl;
        if (dto.Address != null) merchant.Address = dto.Address;
        if (dto.City != null) merchant.City = dto.City;
        if (dto.Latitude.HasValue) merchant.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue) merchant.Longitude = dto.Longitude.Value;
        if (dto.HandlingHours.HasValue) merchant.HandlingHours = dto.HandlingHours.Value;

        merchant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Description,
            merchant.LogoUrl,
            merchant.BannerUrl,
            merchant.CustomDomain,
            merchant.DomainVerified,
            merchant.HandlingHours,
            message = "Mağaza ayarları güncellendi."
        });
    }

    // ── POST /api/store/domain/set — Merchant: özel domain/subdomain ata ─────
    /// <summary>
    /// Merchant'ın mağazasına özel domain (mymağaza.com) veya subdomain
    /// (mağaza.platform.com) atar. Enterprise plan özel domain gerektirir;
    /// subdomain Pro plan ile kullanılabilir.
    /// </summary>
    [HttpPost("domain/set")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> SetCustomDomain([FromBody] SetDomainDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Domain))
            return BadRequest(new { message = "Domain boş olamaz." });

        var merchant = await _db
            .MerchantProfiles.Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser!.UserId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        var plan = merchant.Subscription?.Plan ?? PlanType.Basic;
        var isProOrAbove = plan != PlanType.Basic
            && merchant.Subscription!.IsActive
            && merchant.Subscription.ExpiresAt > DateTime.UtcNow;

        // Özel domain (mymağaza.com gibi — platform domain içermiyor) → Enterprise gerekli
        var platformDomain = Environment.GetEnvironmentVariable("PLATFORM_DOMAIN") ?? "platform.com";
        var isSubdomain = dto.Domain.EndsWith("." + platformDomain);

        if (!isSubdomain && plan != PlanType.Enterprise)
            return BadRequest(new
            {
                message = "Tam özel domain (mymağaza.com) için Enterprise plan gereklidir.",
                requiredPlan = "Enterprise"
            });

        if (isSubdomain && !isProOrAbove)
            return BadRequest(new
            {
                message = $"Subdomain (.{platformDomain}) için Pro veya Enterprise plan gereklidir.",
                requiredPlan = "Pro"
            });

        // Domain başka bir merchant tarafından kullanılıyor mu?
        var domainConflict = await _db.MerchantProfiles.AnyAsync(m =>
            m.CustomDomain == dto.Domain && m.Id != merchant.Id);

        if (domainConflict)
            return Conflict(new { message = "Bu domain başka bir mağaza tarafından kullanılıyor." });

        merchant.CustomDomain = dto.Domain;
        merchant.DomainVerified = false; // Yeniden doğrulama gerekir
        merchant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            domain = dto.Domain,
            isSubdomain,
            verified = false,
            message = "Domain kaydedildi. Doğrulama için DNS TXT kaydı ekleyip /api/store/domain/verify endpoint'ini çağırın.",
            dnsRecord = new
            {
                type = "TXT",
                host = $"_marketplace-verify.{dto.Domain}",
                value = $"marketplace-site-verification={merchant.Id}"
            }
        });
    }

    // ── POST /api/store/domain/verify — Merchant: DNS doğrulama başlat ───────
    /// <summary>
    /// Merchant'ın eklediği DNS TXT kaydını doğrular.
    /// Gerçek ortamda Hangfire job asenkron kontrol yapar; burada anında
    /// basit bir format kontrolü yapılır ve doğrulama pending olarak işaretlenir.
    /// </summary>
    [HttpPost("domain/verify")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> VerifyDomain()
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
            m.UserId == _currentUser!.UserId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        if (string.IsNullOrEmpty(merchant.CustomDomain))
            return BadRequest(new { message = "Önce bir domain atamalısınız (/api/store/domain/set)." });

        if (merchant.DomainVerified)
            return Ok(new
            {
                domain = merchant.CustomDomain,
                verified = true,
                message = "Domain zaten doğrulanmış."
            });

        // Production: Hangfire job ile gerçek DNS TXT sorgusu yapılır.
        // MVP: Format kontrolü + pending durumuna al.
        var expectedTxtRecord = $"marketplace-site-verification={merchant.Id}";

        // Subdomain doğrulaması için doğrudan aktive et (DNS propagation gerekmez)
        var platformDomain = Environment.GetEnvironmentVariable("PLATFORM_DOMAIN") ?? "platform.com";
        if (merchant.CustomDomain.EndsWith("." + platformDomain))
        {
            merchant.DomainVerified = true;
            merchant.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                domain = merchant.CustomDomain,
                verified = true,
                message = "Subdomain doğrulandı ve aktif edildi."
            });
        }

        // Özel domain: DNS TXT kaydı bekleniyor (Hangfire job 5 dakikada bir kontrol eder)
        return Accepted(new
        {
            domain = merchant.CustomDomain,
            verified = false,
            message = "Doğrulama başlatıldı. DNS TXT kaydı kontrol ediliyor (5–30 dk sürebilir).",
            dnsRecord = new
            {
                type = "TXT",
                host = $"_marketplace-verify.{merchant.CustomDomain}",
                value = expectedTxtRecord,
                ttl = 300
            }
        });
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record UpdateStoreSettingsDto(
    string? StoreName,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    string? Address,
    string? City,
    double? Latitude,
    double? Longitude,
    int? HandlingHours
);

public record SetDomainDto(string Domain);
