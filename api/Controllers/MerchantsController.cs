using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "MerchantOnly")]
public class MerchantsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MerchantsController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // ── PROFILE ─────────────────────────────────────────────────────────────

    /// <summary>Kendi merchant profili</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            return Unauthorized();

        var merchant = await _db
            .MerchantProfiles.Include(m => m.User)
            .Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == userId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        return Ok(
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.Slug,
                merchant.Latitude,
                merchant.Longitude,
                merchant.HandlingHours,
                merchant.IsActive,
                merchant.CreatedAt,
                merchant.LogoUrl,
                merchant.BannerUrl,
                User = new { merchant.User.Email },
                Subscription = merchant.Subscription == null
                    ? null
                    : new
                    {
                        merchant.Subscription.Plan,
                        merchant.Subscription.ExpiresAt,
                        merchant.Subscription.IsActive,
                    },
            }
        );
    }

    /// <summary>Profil güncelle (lokasyon, handling süresi, görsel)</summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            return Unauthorized();

        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);

        if (merchant == null)
            return NotFound();

        merchant.StoreName = dto.StoreName ?? merchant.StoreName;
        merchant.Latitude = dto.Latitude ?? merchant.Latitude;
        merchant.Longitude = dto.Longitude ?? merchant.Longitude;
        merchant.HandlingHours = dto.HandlingHours ?? merchant.HandlingHours;
        merchant.LogoUrl = dto.LogoUrl ?? merchant.LogoUrl;
        merchant.BannerUrl = dto.BannerUrl ?? merchant.BannerUrl;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.HandlingHours,
            }
        );
    }

    // ── OFFERS ──────────────────────────────────────────────────────────────

    /// <summary>Kendi teklifleri listesi</summary>
    [HttpGet("offers")]
    public async Task<IActionResult> GetOffers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] bool? publishedToMarket = null,
        [FromQuery] bool? publishedToStore = null
    )
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        var query = _db
            .ProductOffers.Include(o => o.Product)
                .ThenInclude(p => p.Category)
            .Where(o => o.MerchantId == merchant.Id && !o.IsDeleted)
            .AsQueryable();

        if (publishedToMarket.HasValue)
            query = query.Where(o => o.PublishToMarket == publishedToMarket.Value);

        if (publishedToStore.HasValue)
            query = query.Where(o => o.PublishToStore == publishedToStore.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                o.Id,
                o.Price,
                o.Stock,
                o.Rating,
                o.PublishToMarket,
                o.PublishToStore,
                o.CreatedAt,
                Product = new
                {
                    o.Product.Id,
                    o.Product.Name,
                    o.Product.Images,
                    Category = o.Product.Category == null ? null : o.Product.Category.Name,
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

    /// <summary>Yeni teklif ekle (var olan bir ürüne)</summary>
    [HttpPost("offers")]
    public async Task<IActionResult> CreateOffer([FromBody] CreateOfferDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        // Ürün mevcut mu?
        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product == null || product.IsDeleted)
            return BadRequest(new { message = "Ürün bulunamadı." });

        // Bu merchant zaten bu ürüne teklif vermiş mi?
        var existingOffer = await _db.ProductOffers.FirstOrDefaultAsync(o =>
            o.ProductId == dto.ProductId && o.MerchantId == merchant.Id && !o.IsDeleted
        );

        if (existingOffer != null)
            return BadRequest(
                new { message = "Bu ürün için zaten bir teklifiniz var. Güncelleme yapın." }
            );

        // Abonelik kontrolü: marketplace'e yayınlamak için Pro gerekiyor
        if (dto.PublishToMarket == true)
        {
            var hasPro = await _db.Subscriptions.AnyAsync(s =>
                s.MerchantId == merchant.Id
                && s.IsActive
                && s.ExpiresAt > DateTime.UtcNow
                && s.Plan != PlanType.Basic
            );
            if (!hasPro)
                return BadRequest(
                    new
                    {
                        message = "Marketplace'e yayınlamak için Pro veya Enterprise plan gereklidir.",
                    }
                );
        }

        var offer = new ProductOffer
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            MerchantId = merchant.Id,
            Price = dto.Price,
            Stock = dto.Stock,
            PublishToMarket = dto.PublishToMarket ?? false,
            PublishToStore = dto.PublishToStore ?? true,
            Rating = 0,
            CreatedAt = DateTime.UtcNow,
        };

        _db.ProductOffers.Add(offer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetOffers),
            null,
            new
            {
                offer.Id,
                offer.Price,
                offer.Stock,
            }
        );
    }

    /// <summary>Teklif güncelle (fiyat / stok)</summary>
    [HttpPut("offers/{id:guid}")]
    public async Task<IActionResult> UpdateOffer(Guid id, [FromBody] UpdateOfferDto dto)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var offer = await _db.ProductOffers.FirstOrDefaultAsync(o =>
            o.Id == id && o.MerchantId == merchant.Id && !o.IsDeleted
        );

        if (offer == null)
            return NotFound(new { message = "Teklif bulunamadı." });

        offer.Price = dto.Price ?? offer.Price;
        offer.Stock = dto.Stock ?? offer.Stock;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                offer.Id,
                offer.Price,
                offer.Stock,
            }
        );
    }

    /// <summary>Marketplace / E-store yayın toggle</summary>
    [HttpPatch("offers/{id:guid}/publish")]
    public async Task<IActionResult> TogglePublish(Guid id, [FromBody] PublishToggleDto dto)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var offer = await _db.ProductOffers.FirstOrDefaultAsync(o =>
            o.Id == id && o.MerchantId == merchant.Id && !o.IsDeleted
        );

        if (offer == null)
            return NotFound(new { message = "Teklif bulunamadı." });

        // Marketplace toggle için abonelik kontrolü
        if (dto.PublishToMarket == true && offer.PublishToMarket == false)
        {
            var hasPro = await _db.Subscriptions.AnyAsync(s =>
                s.MerchantId == merchant.Id
                && s.IsActive
                && s.ExpiresAt > DateTime.UtcNow
                && s.Plan != PlanType.Basic
            );
            if (!hasPro)
                return BadRequest(
                    new
                    {
                        message = "Marketplace'e yayınlamak için Pro veya Enterprise plan gereklidir.",
                    }
                );
        }

        if (dto.PublishToMarket.HasValue)
            offer.PublishToMarket = dto.PublishToMarket.Value;
        if (dto.PublishToStore.HasValue)
            offer.PublishToStore = dto.PublishToStore.Value;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                offer.Id,
                offer.PublishToMarket,
                offer.PublishToStore,
            }
        );
    }

    /// <summary>Teklif kaldır (soft-delete)</summary>
    [HttpDelete("offers/{id:guid}")]
    public async Task<IActionResult> DeleteOffer(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var offer = await _db.ProductOffers.FirstOrDefaultAsync(o =>
            o.Id == id && o.MerchantId == merchant.Id && !o.IsDeleted
        );

        if (offer == null)
            return NotFound();

        offer.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── ORDERS ──────────────────────────────────────────────────────────────

    /// <summary>Merchant'a gelen siparişler</summary>
    [HttpGet("orders")]
    public async Task<IActionResult> GetIncomingOrders(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var query = _db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Offer)
            .Include(o => o.Customer)
            .Where(o => o.Items.Any(i => i.Offer.MerchantId == merchant.Id))
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<OrderStatus>(status, true, out var parsedStatus)
        )
            query = query.Where(o => o.Status == parsedStatus);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                o.Id,
                o.Status,
                o.TotalAmount,
                o.ShippingRate,
                o.Source,
                o.CreatedAt,
                Customer = new { o.Customer.Email },
                MyItems = o
                    .Items.Where(i => i.Offer.MerchantId == merchant.Id)
                    .Select(i => new
                    {
                        i.Quantity,
                        i.UnitPrice,
                        ProductName = i.Offer.Product.Name,
                    }),
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

    /// <summary>Sipariş hazırlandı (merchant → PACKED)</summary>
    [HttpPatch("orders/{id:guid}/pack")]
    public async Task<IActionResult> MarkPacked(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var order = await _db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Offer)
            .FirstOrDefaultAsync(o =>
                o.Id == id && o.Items.Any(i => i.Offer.MerchantId == merchant.Id)
            );

        if (order == null)
            return NotFound(new { message = "Sipariş bulunamadı." });

        if (order.Status != OrderStatus.PaymentConfirmed)
            return BadRequest(
                new
                {
                    message = $"Bu sipariş '{order.Status}' durumunda, 'Hazırlandı' işlemi yapılamaz.",
                }
            );

        order.Status = OrderStatus.LabelGenerated; // Packed → etiket üretilmeye hazır
        await _db.SaveChangesAsync();

        return Ok(
            new
            {
                order.Id,
                order.Status,
                message = "Sipariş hazırlandı olarak işaretlendi.",
            }
        );
    }

    // ── ANALYTICS ───────────────────────────────────────────────────────────

    /// <summary>Satış analitikleri (marketplace vs e-store)</summary>
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] string period = "month")
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var from = period switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddDays(-30),
            "year" => DateTime.UtcNow.AddDays(-365),
            _ => DateTime.UtcNow.AddDays(-30),
        };

        var orders = await _db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Offer)
            .Where(o =>
                o.CreatedAt >= from
                && o.Status != OrderStatus.Cancelled
                && o.Items.Any(i => i.Offer.MerchantId == merchant.Id)
            )
            .ToListAsync();

        var marketplaceOrders = orders.Where(o => o.Source == OrderSource.Marketplace).ToList();
        var estoreOrders = orders.Where(o => o.Source == OrderSource.EStore).ToList();

        decimal CalcRevenue(List<Order> list) =>
            list.SelectMany(o => o.Items.Where(i => i.Offer.MerchantId == merchant.Id))
                .Sum(i => i.UnitPrice * i.Quantity);

        return Ok(
            new
            {
                period,
                marketplace = new
                {
                    orderCount = marketplaceOrders.Count,
                    revenue = CalcRevenue(marketplaceOrders),
                },
                estore = new
                {
                    orderCount = estoreOrders.Count,
                    revenue = CalcRevenue(estoreOrders),
                },
                total = new { orderCount = orders.Count, revenue = CalcRevenue(orders) },
            }
        );
    }

    /// <summary>En çok satan ürünler</summary>
    [HttpGet("analytics/top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 5)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var topProducts = await _db
            .OrderItems.Include(i => i.Offer)
                .ThenInclude(o => o.Product)
            .Where(i =>
                i.Offer.MerchantId == merchant.Id && i.Order.Status != OrderStatus.Cancelled
            )
            .GroupBy(i => new { i.Offer.Product.Id, i.Offer.Product.Name })
            .Select(g => new
            {
                ProductId = g.Key.Id,
                ProductName = g.Key.Name,
                TotalSold = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity),
            })
            .OrderByDescending(g => g.TotalSold)
            .Take(limit)
            .ToListAsync();

        return Ok(topProducts);
    }

    /// <summary>Fatura listesi</summary>
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var invoices = await _db
            .Orders.Where(o =>
                o.Items.Any(i => i.Offer.MerchantId == merchant.Id)
                && o.Status == OrderStatus.Delivered
            )
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                // [..8] yerine Substring — EF expression tree'de Range desteklenmiyor
                InvoiceNo = "INV-" + o.Id.ToString().Substring(0, 8).ToUpper(),
                OrderId = o.Id,
                o.TotalAmount,
                o.CreatedAt,
                PdfUrl = (string?)null,
            })
            .ToListAsync();

        return Ok(invoices);
    }

    // _currentUser.UserId string ise Guid.Parse ile karşılaştır
    private async Task<MerchantProfile?> GetCurrentMerchantAsync() =>
        await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
            m.UserId == Guid.Parse(_currentUser.UserId)
        );
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public record UpdateProfileDto(
    string? StoreName,
    double? Latitude,
    double? Longitude,
    int? HandlingHours,
    string? LogoUrl,
    string? BannerUrl
);

public record CreateOfferDto(
    Guid ProductId,
    decimal Price,
    int Stock,
    bool? PublishToMarket,
    bool? PublishToStore
);

public record UpdateOfferDto(decimal? Price, int? Stock);

public record PublishToggleDto(bool? PublishToMarket, bool? PublishToStore);
