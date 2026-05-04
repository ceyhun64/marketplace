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
        [FromQuery] string? subcategory = null,
        [FromQuery] List<string>? tags = null,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sort = "newest"
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c != null ? c.Parent : null)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .AsQueryable();

        // Kategori filtresi: ana kategori slug'ına göre (hem ana hem alt kategoriler dahil)
        if (!string.IsNullOrEmpty(category))
            query = query.Where(p =>
                p.Category != null
                && (
                    p.Category.Slug == category
                    || (p.Category.Parent != null && p.Category.Parent.Slug == category)
                )
            );

        // Alt kategori filtresi: sadece belirtilen alt kategoriye göre
        if (!string.IsNullOrEmpty(subcategory))
            query = query.Where(p => p.Category != null && p.Category.Slug == subcategory);

        // Tag filtresi
        if (tags != null && tags.Count > 0)
            query = query.Where(p => p.Tags.Any(t => tags.Contains(t)));

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
            .Where(p => p.Id == id && !p.IsDeleted)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.ShortDescription,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                p.PublishToMarket,
                p.PublishToStore,
                p.IsApproved,
                p.CreatedAt,
                CategoryName = p.Category == null ? null : p.Category.Name,
                CategorySlug = p.Category == null ? null : p.Category.Slug,
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

        // Frontend { data: ... } yapısı bekliyor
        return Ok(new { data = product });
    }

    /// <summary>Ürün buy-box — en iyi fiyatlı aktif teklif</summary>
    [HttpGet("{id:guid}/buybox")]
    public async Task<IActionResult> GetBuyBox(Guid id, [FromQuery] decimal? customerLat = null, [FromQuery] decimal? customerLng = null)
    {
        var product = await _db.Products
            .Include(p => p.Merchant)
            .Where(p => p.Id == id && !p.IsDeleted && p.IsApproved && p.Stock > 0)
            .Select(p => new
            {
                OfferId = p.Id,
                Price = p.Price,
                Stock = p.Stock,
                MerchantId = p.Merchant.Id,
                MerchantName = p.Merchant.StoreName,
                MerchantSlug = p.Merchant.Slug,
                Rating = (double?)4.5,
                Eta = "2-4 iş günü",
                ShippingRate = "STANDARD",
            })
            .OrderBy(p => p.Price)
            .FirstOrDefaultAsync();

        if (product == null)
            return Ok(new { data = (object?)null });

        return Ok(new { data = product });
    }

    /// <summary>Ürün teklifleri — tüm satıcılar</summary>
    [HttpGet("{id:guid}/offers")]
    public async Task<IActionResult> GetOffers(Guid id, [FromQuery] decimal? customerLat = null, [FromQuery] decimal? customerLng = null)
    {
        var offers = await _db.Products
            .Include(p => p.Merchant)
            .Where(p => p.Id == id && !p.IsDeleted && p.IsApproved && p.Stock > 0)
            .Select(p => new
            {
                Id = p.Id,
                Price = p.Price,
                Stock = p.Stock,
                MerchantId = p.Merchant.Id,
                MerchantName = p.Merchant.StoreName,
                MerchantSlug = p.Merchant.Slug,
                Rating = (double?)4.5,
                Eta = "2-4 iş günü",
                ShippingRate = "STANDARD",
            })
            .OrderBy(p => p.Price)
            .ToListAsync();

        return Ok(new { data = offers });
    }

    /// <summary>Full-text arama — kategori, alt kategori, tag, fiyat filtreli</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q = "",
        [FromQuery] string? category = null,
        [FromQuery] string? subcategory = null,
        [FromQuery] List<string>? tags = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c != null ? c.Parent : null)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .AsQueryable();

        // Full-text arama
        if (!string.IsNullOrEmpty(q))
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{q}%")
                || EF.Functions.ILike(p.Description, $"%{q}%")
                || p.Tags.Any(t => EF.Functions.ILike(t, $"%{q}%"))
            );

        // Kategori filtresi (ana kategori slug'ı — hem ana hem alt dahil)
        if (!string.IsNullOrEmpty(category))
            query = query.Where(p =>
                p.Category != null
                && (
                    p.Category.Slug == category
                    || (p.Category.Parent != null && p.Category.Parent.Slug == category)
                )
            );

        // Alt kategori filtresi
        if (!string.IsNullOrEmpty(subcategory))
            query = query.Where(p => p.Category != null && p.Category.Slug == subcategory);

        // Tag filtresi
        if (tags != null && tags.Count > 0)
            query = query.Where(p => p.Tags.Any(t => tags.Contains(t)));

        // Fiyat aralığı
        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        // Sıralama
        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var results = await query
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
                items = results,
            }
        );
    }

    /// <summary>Öne çıkan ürünler</summary>
    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured([FromQuery] int limit = 8)
    {
        var products = await _db
            .Products.Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved && p.Stock > 0)
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
            // Admin: dto'da MerchantId verilmişse onu kullan, yoksa kendi profilini bul
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
                var adminMerchant = await _db
                    .MerchantProfiles.Where(m => m.UserId == Guid.Parse(userIdClaim!))
                    .FirstOrDefaultAsync();
                if (adminMerchant == null)
                {
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
            var merchant = await _db.MerchantProfiles
                .Include(m => m.Subscription)
                .FirstOrDefaultAsync(m => m.UserId == Guid.Parse(userIdClaim!));
            if (merchant == null)
                return Forbid();
            merchantId = merchant.Id;

            // Plan kontrolü: PublishToMarket sadece Pro+ planlarda
            if (dto.PublishToMarket)
            {
                var plan = merchant.Subscription?.Plan ?? api.Domain.Enums.PlanType.Basic;
                if (plan == api.Domain.Enums.PlanType.Basic)
                    return BadRequest(new ApiResponse<string>(
                        "Marketplace'e ürün yayınlamak için Pro veya Enterprise planı gereklidir."));
            }
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            ShortDescription = dto.ShortDescription?.Trim(),
            CategoryId = dto.CategoryId,
            Images = dto.Images ?? new List<string>(),
            Tags = dto.Tags ?? new List<string>(),
            Price = dto.Price,
            Stock = dto.Stock,
            PublishToMarket = dto.PublishToMarket,
            PublishToStore = dto.PublishToStore,
            IsApproved = userRole == "Admin",
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
            .Where(p => !p.IsDeleted && !p.IsApproved)
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
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.IsApproved = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün onaylandı." });
    }

    /// <summary>Ürün güncelle (Admin veya Merchant)</summary>
    [HttpPatch("{id:guid}/update")]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest dto)
    {
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        // Merchant sadece kendi ürününü güncelleyebilir
        if (userRole == "Merchant")
        {
            var merchant = await _db.MerchantProfiles
                .Include(m => m.Subscription)
                .FirstOrDefaultAsync(m => m.UserId == Guid.Parse(userIdClaim!));
            if (merchant == null || product.MerchantId != merchant.Id)
                return Forbid();

            // Plan kontrolü: PublishToMarket sadece Pro+ planlarda
            if (dto.PublishToMarket == true)
            {
                var plan = merchant.Subscription?.Plan ?? api.Domain.Enums.PlanType.Basic;
                if (plan == api.Domain.Enums.PlanType.Basic)
                    return BadRequest(new ApiResponse<string>(
                        "Marketplace'e ürün yayınlamak için Pro veya Enterprise planı gereklidir."));
            }
        }

        if (dto.Name != null) product.Name = dto.Name.Trim();
        if (dto.Description != null) product.Description = dto.Description.Trim();
        if (dto.ShortDescription != null) product.ShortDescription = dto.ShortDescription.Trim();
        if (dto.CategoryId.HasValue) product.CategoryId = dto.CategoryId.Value;
        if (dto.Images != null) product.Images = dto.Images;
        if (dto.Tags != null) product.Tags = dto.Tags;
        if (dto.Price.HasValue) product.Price = dto.Price.Value;
        if (dto.Stock.HasValue) product.Stock = dto.Stock.Value;
        if (dto.PublishToMarket.HasValue) product.PublishToMarket = dto.PublishToMarket.Value;
        if (dto.PublishToStore.HasValue) product.PublishToStore = dto.PublishToStore.Value;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse<object>(new
        {
            product.Id,
            product.Name,
            product.Price,
            product.Stock,
            product.IsApproved,
            product.PublishToMarket,
            product.PublishToStore,
        }));
    }

    /// <summary>Ürün soft-delete</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Marketplace ürünlerinden kullanılan tüm tag listesi</summary>
    [HttpGet("tags")]
    public async Task<IActionResult> GetAllTags()
    {
        var tags = await _db.Products
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved)
            .SelectMany(p => p.Tags)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();

        return Ok(tags);
    }

    /// <summary>Ürün reddet (Admin)</summary>
    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectProductRequest dto)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.IsApproved = false;
        product.PublishToMarket = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün reddedildi.", reason = dto.Reason });
    }
}

// ── Local request / response types ─────────────────────────────────────────

/// <summary>
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public Guid? CategoryId { get; set; }
    public List<string>? Images { get; set; }
    public List<string>? Tags { get; set; }
    public decimal? Price { get; set; }
    public int? Stock { get; set; }
    public bool? PublishToMarket { get; set; }
    public bool? PublishToStore { get; set; }
}

public class RejectProductRequest
{
    public string? Reason { get; set; }
}
