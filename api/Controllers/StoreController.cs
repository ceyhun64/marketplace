using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoreController : ControllerBase
{
    private readonly AppDbContext _db;

    public StoreController(AppDbContext db) => _db = db;

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
                ProductCount = m.Products.Count(p =>
                    p.PublishToStore && p.Stock > 0 && !p.IsDeleted
                ),
            })
            .FirstOrDefaultAsync();

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

        if (merchant == null)
            return NotFound(new { message = "Mağaza bulunamadı." });

        var query = _db
            .Products.Include(p => p.Category)
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
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                p.Stock,
                Category = p.Category == null ? null : new { p.Category.Name, p.Category.Slug },
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
}
