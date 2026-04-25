using api.Common.DTOs;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db) => _db = db;

    // ── PUBLIC ──────────────────────────────────────────────────────────────

    /// <summary>Marketplace ürün listesi</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sort = "newest"
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category != null && p.Category.Slug == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{search}%")
                || EF.Functions.ILike(p.Description, $"%{search}%")
            );

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                p.PublishToMarket,
                p.PublishToStore,
                p.IsApproved,
                p.CreatedAt,
                Category = p.Category == null
                    ? null
                    : new
                    {
                        p.Category.Id,
                        p.Category.Name,
                        p.Category.Slug,
                    },
                Merchant = new
                {
                    p.Merchant.Id,
                    p.Merchant.StoreName,
                    p.Merchant.Slug,
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

    /// <summary>Ürün detayı</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                p.PublishToMarket,
                p.PublishToStore,
                p.IsApproved,
                p.CreatedAt,
                Category = p.Category == null
                    ? null
                    : new
                    {
                        p.Category.Id,
                        p.Category.Name,
                        p.Category.Slug,
                    },
                Merchant = new
                {
                    p.Merchant.Id,
                    p.Merchant.StoreName,
                    p.Merchant.Slug,
                },
            })
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });
        return Ok(product);
    }

    /// <summary>Full-text arama</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q = "",
        [FromQuery] string? category = null,
        [FromQuery] List<string>? tags = null,
        [FromQuery] int limit = 20
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
            .Where(p => p.PublishToMarket && p.IsApproved && EF.Functions.ILike(p.Name, $"%{q}%"))
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category != null && p.Category.Slug == category);

        if (tags != null && tags.Count > 0)
            query = query.Where(p => p.Tags.Any(t => tags.Contains(t)));

        var results = await query
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                Category = p.Category == null ? null : p.Category.Name,
            })
            .ToListAsync();

        return Ok(results);
    }

    /// <summary>Öne çıkan ürünler</summary>
    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured([FromQuery] int limit = 8)
    {
        var products = await _db
            .Products.Include(p => p.Merchant)
            .Where(p => p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                Merchant = new { p.Merchant.StoreName, p.Merchant.Slug },
            })
            .ToListAsync();

        return Ok(products);
    }

    // ── ADMIN ────────────────────────────────────────────────────────────────

    /// <summary>Admin: tüm ürünler (onaylı/bekleyen/hepsi)</summary>
    [HttpGet("admin/all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AdminGetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? search = null
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{search}%")
                || EF.Functions.ILike(p.Description, $"%{search}%")
            );

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                p.PublishToMarket,
                p.PublishToStore,
                p.IsApproved,
                p.CreatedAt,
                CategoryName = p.Category == null ? null : p.Category.Name,
                MerchantStoreName = p.Merchant.StoreName,
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

    /// <summary>Ürün oluştur (Admin veya Merchant)</summary>
    [HttpPost]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Kategori var mı?
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Geçersiz kategori." });

        // MerchantId belirleme: admin başkası adına ekleyebilir, merchant sadece kendisi
        Guid merchantId;
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userRole == "Admin")
        {
            // Admin: dto'da MerchantId verilmişse onu kullan, yoksa ilk aktif merchant'ı kullan
            if (dto.MerchantId.HasValue)
            {
                var merchantExists = await _db.MerchantProfiles.AnyAsync(m =>
                    m.Id == dto.MerchantId.Value
                );
                if (!merchantExists)
                    return BadRequest(new { message = "Belirtilen merchant bulunamadı." });
                merchantId = dto.MerchantId.Value;
            }
            else
            {
                // Admin kendi adına ekliyorsa, admin user'ının merchant profili aranır
                var adminMerchant = await _db
                    .MerchantProfiles.Where(m => m.UserId == Guid.Parse(userIdClaim!))
                    .FirstOrDefaultAsync();
                if (adminMerchant == null)
                {
                    // Admin için merchant profili yoksa ilk aktif merchant'a ata
                    var fallback = await _db.MerchantProfiles.FirstOrDefaultAsync(m => m.IsActive);
                    if (fallback == null)
                        return BadRequest(
                            new
                            {
                                message = "Ürün eklemek için en az bir merchant gerekli. MerchantId gönderin.",
                            }
                        );
                    merchantId = fallback.Id;
                }
                else
                {
                    merchantId = adminMerchant.Id;
                }
            }
        }
        else
        {
            // Merchant: kendi profilini bul
            var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
                m.UserId == Guid.Parse(userIdClaim!)
            );
            if (merchant == null)
                return Forbid();
            merchantId = merchant.Id;
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            CategoryId = dto.CategoryId,
            Images = dto.Images ?? new List<string>(),
            Tags = dto.Tags ?? new List<string>(),
            Price = dto.Price,
            Stock = dto.Stock,
            PublishToMarket = dto.PublishToMarket,
            PublishToStore = dto.PublishToStore,
            IsApproved = userRole == "Admin", // Admin eklerse otomatik onaylı
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = product.Id },
            new
            {
                product.Id,
                product.Name,
                product.Price,
                product.Stock,
                product.IsApproved,
                product.MerchantId,
            }
        );
    }

    /// <summary>Onay bekleyen ürünler</summary>
    [HttpGet("pending")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetPending()
    {
        var pending = await _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => !p.IsApproved)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                p.CreatedAt,
                Category = p.Category == null ? null : p.Category.Name,
                Merchant = new { p.Merchant.StoreName, p.Merchant.Slug },
            })
            .ToListAsync();

        return Ok(pending);
    }

    /// <summary>Ürün onayla</summary>
    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        product.IsApproved = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün onaylandı." });
    }

    /// <summary>Ürün soft-delete</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
