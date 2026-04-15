using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoreController : ControllerBase
{
    private readonly AppDbContext _db;

    public StoreController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Tüm aktif e-mağazaların listesi</summary>
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
                ProductCount = m.Offers.Count(o => o.PublishToStore && o.Stock > 0 && !o.IsDeleted),
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

    /// <summary>E-mağaza profili + bilgileri (slug ile)</summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetStore(string slug)
    {
        var store = await _db
            .MerchantProfiles.Where(m => m.Slug == slug && m.IsActive)
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Slug,
                m.LogoUrl,
                m.BannerUrl,
                m.CreatedAt,
                ProductCount = m.Offers.Count(o => o.PublishToStore && o.Stock > 0 && !o.IsDeleted),
                AverageRating = m.Offers.Where(o => o.Rating > 0).Average(o => (double?)o.Rating),
            })
            .FirstOrDefaultAsync();

        if (store == null)
            return NotFound(new { message = "Mağaza bulunamadı." });
        return Ok(store);
    }

    /// <summary>Mağaza ürünleri (sadece o merchant, publishToStore=true)</summary>
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

        if (merchant == null)
            return NotFound(new { message = "Mağaza bulunamadı." });

        var query = _db
            .ProductOffers.Include(o => o.Product)
                .ThenInclude(p => p.Category)
            .Where(o =>
                o.MerchantId == merchant.Id
                && o.PublishToStore
                && o.Stock > 0
                && !o.IsDeleted
                && !o.Product.IsDeleted
            )
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(o => EF.Functions.ILike(o.Product.Name, $"%{search}%"));

        if (!string.IsNullOrEmpty(category))
            query = query.Where(o =>
                o.Product.Category != null && o.Product.Category.Slug == category
            );

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                OfferId = o.Id,
                o.Price,
                o.Stock,
                o.Rating,
                Product = new
                {
                    o.Product.Id,
                    o.Product.Name,
                    o.Product.Images,
                    Category = o.Product.Category == null
                        ? null
                        : new { o.Product.Category.Name, o.Product.Category.Slug },
                },
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

    /// <summary>Mağaza ürün detayı</summary>
    [HttpGet("{slug}/products/{productId:guid}")]
    public async Task<IActionResult> GetStoreProduct(string slug, Guid productId)
    {
        var offer = await _db
            .ProductOffers.Include(o => o.Product)
                .ThenInclude(p => p.Category)
            .Include(o => o.Merchant)
            .Where(o =>
                o.Merchant.Slug == slug
                && o.Product.Id == productId
                && o.PublishToStore
                && !o.IsDeleted
            )
            .Select(o => new
            {
                OfferId = o.Id,
                o.Price,
                o.Stock,
                o.Rating,
                Product = new
                {
                    o.Product.Id,
                    o.Product.Name,
                    o.Product.Description,
                    o.Product.Images,
                    o.Product.Tags,
                    Category = o.Product.Category == null
                        ? null
                        : new { o.Product.Category.Name, o.Product.Category.Slug },
                },
                Store = new { o.Merchant.StoreName, o.Merchant.Slug },
            })
            .FirstOrDefaultAsync();

        if (offer == null)
            return NotFound(new { message = "Ürün bulunamadı." });
        return Ok(offer);
    }

    /// <summary>Mağazaya özel kategoriler (o mağazada ürün olan kategoriler)</summary>
    [HttpGet("{slug}/categories")]
    public async Task<IActionResult> GetStoreCategories(string slug)
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
            m.Slug == slug && m.IsActive
        );

        if (merchant == null)
            return NotFound(new { message = "Mağaza bulunamadı." });

        var categories = await _db
            .ProductOffers.Include(o => o.Product)
                .ThenInclude(p => p.Category)
            .Where(o => o.MerchantId == merchant.Id && o.PublishToStore && !o.IsDeleted)
            .Where(o => o.Product.Category != null)
            .Select(o => new
            {
                o.Product.Category!.Id,
                o.Product.Category.Name,
                o.Product.Category.Slug,
            })
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }
}
