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

    public ProductsController(AppDbContext db)
    {
        _db = db;
    }

    // ── PUBLIC ──────────────────────────────────────────────────────────────

    /// <summary>Marketplace ürün listesi — pagination + filtre</summary>
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
            .Include(p => p.Offers.Where(o => o.PublishToMarket && o.Stock > 0))
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category != null && p.Category.Slug == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{search}%")
                || EF.Functions.ILike(p.Description, $"%{search}%")
            );

        if (minPrice.HasValue)
            query = query.Where(p => p.Offers.Any(o => o.Price >= minPrice.Value));

        if (maxPrice.HasValue)
            query = query.Where(p => p.Offers.Any(o => o.Price <= maxPrice.Value));

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Offers.Min(o => (decimal?)o.Price)),
            "price_desc" => query.OrderByDescending(p => p.Offers.Max(o => (decimal?)o.Price)),
            "rating" => query.OrderByDescending(p => p.Offers.Average(o => (double?)o.Rating)),
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
                Category = p.Category == null
                    ? null
                    : new
                    {
                        p.Category.Id,
                        p.Category.Name,
                        p.Category.Slug,
                    },
                BestOffer = p
                    .Offers.Where(o => o.PublishToMarket && o.Stock > 0)
                    .OrderBy(o => o.Price)
                    .Select(o => new
                    {
                        o.Price,
                        o.Stock,
                        o.Rating,
                    })
                    .FirstOrDefault(),
                OfferCount = p.Offers.Count(o => o.PublishToMarket && o.Stock > 0),
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
            .Include(p => p.Offers.Where(o => !o.IsDeleted))
                .ThenInclude(o => o.Merchant)
            .Where(p => p.Id == id && !p.IsDeleted)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.CreatedAt,
                Category = p.Category == null
                    ? null
                    : new
                    {
                        p.Category.Id,
                        p.Category.Name,
                        p.Category.Slug,
                    },
                Offers = p
                    .Offers.Where(o => o.PublishToMarket && o.Stock > 0 && !o.IsDeleted)
                    .OrderBy(o => o.Price)
                    .Select(o => new
                    {
                        o.Id,
                        o.Price,
                        o.Stock,
                        o.Rating,
                        Merchant = new
                        {
                            o.Merchant.Id,
                            o.Merchant.StoreName,
                            o.Merchant.Slug,
                        },
                    }),
            })
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });
        return Ok(product);
    }

    /// <summary>Ürüne ait tüm merchant teklifleri (Buy Box için)</summary>
    [HttpGet("{id:guid}/offers")]
    public async Task<IActionResult> GetOffers(Guid id)
    {
        var offers = await _db
            .ProductOffers.Include(o => o.Merchant)
            .Where(o => o.ProductId == id && o.PublishToMarket && o.Stock > 0 && !o.IsDeleted)
            .OrderBy(o => o.Price)
            .Select(o => new
            {
                o.Id,
                o.Price,
                o.Stock,
                o.Rating,
                o.PublishToMarket,
                o.PublishToStore,
                Merchant = new
                {
                    o.Merchant.Id,
                    o.Merchant.StoreName,
                    o.Merchant.Slug,
                    o.Merchant.Latitude,
                    o.Merchant.Longitude,
                },
            })
            .ToListAsync();

        return Ok(offers);
    }

    /// <summary>Buy Box — en iyi teklif hesapla</summary>
    [HttpGet("{id:guid}/buybox")]
    public async Task<IActionResult> GetBuyBox(
        Guid id,
        [FromQuery] double? customerLat = null,
        [FromQuery] double? customerLng = null,
        [FromServices] IBuyBoxService? buyBoxService = null
    )
    {
        if (buyBoxService == null)
            return StatusCode(501, new { message = "BuyBox servisi henüz yapılandırılmadı." });

        var winner = await buyBoxService.GetWinningOfferAsync(id, customerLat, customerLng);
        if (winner == null)
            return NotFound(new { message = "Bu ürün için aktif teklif yok." });
        return Ok(winner);
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
            .Where(p => !p.IsDeleted && EF.Functions.ILike(p.Name, $"%{q}%"))
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
            .Products.Include(p => p.Offers)
            .Where(p => !p.IsDeleted && p.Offers.Any(o => o.PublishToMarket && o.Stock > 0))
            .OrderByDescending(p => p.Offers.Average(o => (double?)o.Rating))
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                BestPrice = p.Offers.Where(o => o.PublishToMarket).Min(o => (decimal?)o.Price),
            })
            .ToListAsync();

        return Ok(products);
    }

    // ── ADMIN ───────────────────────────────────────────────────────────────

    /// <summary>Yeni ürün oluştur (Master Catalogue) — Admin</summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Token'dan kullanıcı ID'sini oku
        var userIdStr =
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Kullanıcı kimliği alınamadı." });

        var category = await _db.Categories.FindAsync(dto.CategoryId);
        if (category == null)
            return BadRequest(new { message = "Kategori bulunamadı." });

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            Images = dto.Images ?? [],
            Tags = dto.Tags ?? [],
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId, // ✅
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
                product.Description,
                product.CategoryId,
                product.Images,
                product.Tags,
                product.CreatedAt,
                product.IsApproved,
            }
        );
    }

    /// <summary>Ürün güncelle — Admin</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateProductDto dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null || product.IsDeleted)
            return NotFound();

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.CategoryId = dto.CategoryId;
        product.Images = dto.Images ?? product.Images;
        product.Tags = dto.Tags ?? product.Tags;

        await _db.SaveChangesAsync();
        return Ok(product);
    }

    /// <summary>Ürün soft-delete — Admin</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null || product.IsDeleted)
            return NotFound();

        product.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Onay bekleyen ürünler — Admin</summary>
    [HttpGet("pending")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetPending()
    {
        var pending = await _db
            .Products.Include(p => p.Category)
            .Where(p => !p.IsApproved && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.CreatedAt,
                Category = p.Category == null ? null : p.Category.Name,
            })
            .ToListAsync();

        return Ok(pending);
    }

    /// <summary>Ürün onayla — Admin</summary>
    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null || product.IsDeleted)
            return NotFound();

        product.IsApproved = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün onaylandı." });
    }
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public record CreateProductDto(
    string Name,
    string Description,
    Guid CategoryId,
    List<string>? Images,
    List<string>? Tags
);

// ── Interface (BuyBox için) ──────────────────────────────────────────────────

public interface IBuyBoxService
{
    Task<object?> GetWinningOfferAsync(Guid productId, double? customerLat, double? customerLng);
}
