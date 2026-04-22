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

    // ── PROFILE ──────────────────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var merchant = await _db
            .MerchantProfiles.Include(m => m.User)
            .Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        return Ok(
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.Slug,
                merchant.LogoUrl,
                merchant.BannerUrl,
                merchant.CustomDomain,
                merchant.Latitude,
                merchant.Longitude,
                merchant.HandlingHours,
                merchant.IsActive,
                merchant.CreatedAt,
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

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
            m.UserId == _currentUser.UserId
        );

        if (merchant == null)
            return NotFound();

        merchant.StoreName = dto.StoreName ?? merchant.StoreName;
        merchant.Latitude = dto.Latitude ?? merchant.Latitude;
        merchant.Longitude = dto.Longitude ?? merchant.Longitude;
        merchant.HandlingHours = dto.HandlingHours ?? merchant.HandlingHours;
        merchant.LogoUrl = dto.LogoUrl ?? merchant.LogoUrl;
        merchant.BannerUrl = dto.BannerUrl ?? merchant.BannerUrl;
        merchant.UpdatedAt = DateTime.UtcNow;

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

    // ── CATALOGUE (Products) ──────────────────────────────────────────────────

    [HttpGet("catalogue")]
    public async Task<IActionResult> GetCatalogue(
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
            .Products.Include(p => p.Category)
            .Where(p => p.MerchantId == merchant.Id)
            .AsQueryable();

        if (publishedToMarket.HasValue)
            query = query.Where(p => p.PublishToMarket == publishedToMarket.Value);
        if (publishedToStore.HasValue)
            query = query.Where(p => p.PublishToStore == publishedToStore.Value);

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
                Category = p.Category == null ? null : p.Category.Name,
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

    [HttpPost("catalogue")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        var category = await _db.Categories.FindAsync(dto.CategoryId);
        if (category == null)
            return BadRequest(new { message = "Kategori bulunamadı." });

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

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchant.Id,
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            Images = dto.Images ?? [],
            Tags = dto.Tags ?? [],
            Price = dto.Price,
            Stock = dto.Stock,
            PublishToMarket = dto.PublishToMarket ?? false,
            PublishToStore = dto.PublishToStore ?? true,
            IsApproved = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCatalogue),
            null,
            new
            {
                product.Id,
                product.Name,
                product.Price,
                product.Stock,
            }
        );
    }

    [HttpPut("catalogue/{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == merchant.Id
        );

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.Name = dto.Name ?? product.Name;
        product.Description = dto.Description ?? product.Description;
        product.Price = dto.Price ?? product.Price;
        product.Stock = dto.Stock ?? product.Stock;
        product.Images = dto.Images ?? product.Images;
        product.Tags = dto.Tags ?? product.Tags;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                product.Id,
                product.Name,
                product.Price,
                product.Stock,
            }
        );
    }

    [HttpPatch("catalogue/{id:guid}/publish")]
    public async Task<IActionResult> TogglePublish(Guid id, [FromBody] PublishToggleDto dto)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == merchant.Id
        );

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        // Marketplace toggle için abonelik kontrolü
        if (dto.PublishToMarket == true && !product.PublishToMarket)
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
            product.PublishToMarket = dto.PublishToMarket.Value;
        if (dto.PublishToStore.HasValue)
            product.PublishToStore = dto.PublishToStore.Value;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                product.Id,
                product.PublishToMarket,
                product.PublishToStore,
            }
        );
    }

    [HttpDelete("catalogue/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == merchant.Id
        );

        if (product == null)
            return NotFound();

        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── ORDERS ───────────────────────────────────────────────────────────────

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
                .ThenInclude(i => i.Product)
            .Include(o => o.Customer)
            .Where(o => o.Items.Any(i => i.MerchantId == merchant.Id))
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var ps))
            query = query.Where(o => o.Status == ps);

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
                    .Items.Where(i => i.MerchantId == merchant.Id)
                    .Select(i => new
                    {
                        i.Quantity,
                        i.UnitPrice,
                        i.ProductName,
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

    [HttpPatch("orders/{id:guid}/pack")]
    public async Task<IActionResult> MarkPacked(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var order = await _db
            .Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.Items.Any(i => i.MerchantId == merchant.Id));

        if (order == null)
            return NotFound(new { message = "Sipariş bulunamadı." });

        if (order.Status != OrderStatus.PaymentConfirmed)
            return BadRequest(
                new { message = $"Bu sipariş '{order.Status}' durumunda, hazırlanamaz." }
            );

        order.Status = OrderStatus.LabelGenerated;
        order.UpdatedAt = DateTime.UtcNow;
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

    // ── ANALYTICS ────────────────────────────────────────────────────────────

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
            .Where(o =>
                o.CreatedAt >= from
                && o.Status != OrderStatus.Cancelled
                && o.Items.Any(i => i.MerchantId == merchant.Id)
            )
            .ToListAsync();

        var mpOrders = orders.Where(o => o.Source == OrderSource.Marketplace).ToList();
        var esOrders = orders.Where(o => o.Source == OrderSource.EStore).ToList();

        decimal Revenue(List<Order> list) =>
            list.SelectMany(o => o.Items.Where(i => i.MerchantId == merchant.Id))
                .Sum(i => i.UnitPrice * i.Quantity);

        return Ok(
            new
            {
                period,
                marketplace = new { orderCount = mpOrders.Count, revenue = Revenue(mpOrders) },
                estore = new { orderCount = esOrders.Count, revenue = Revenue(esOrders) },
                total = new { orderCount = orders.Count, revenue = Revenue(orders) },
            }
        );
    }

    [HttpGet("analytics/top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 5)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var topProducts = await _db
            .OrderItems.Include(i => i.Product)
            .Include(i => i.Order)
            .Where(i => i.MerchantId == merchant.Id && i.Order.Status != OrderStatus.Cancelled)
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalSold = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity),
            })
            .OrderByDescending(g => g.TotalSold)
            .Take(limit)
            .ToListAsync();

        return Ok(topProducts);
    }

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
                o.Items.Any(i => i.MerchantId == merchant.Id) && o.Status == OrderStatus.Delivered
            )
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                InvoiceNo = "INV-" + o.Id.ToString().Substring(0, 8).ToUpper(),
                OrderId = o.Id,
                o.TotalAmount,
                o.CreatedAt,
                PdfUrl = (string?)null,
            })
            .ToListAsync();

        return Ok(invoices);
    }

    private async Task<MerchantProfile?> GetCurrentMerchantAsync() =>
        await _db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record UpdateProfileDto(
    string? StoreName,
    double? Latitude,
    double? Longitude,
    int? HandlingHours,
    string? LogoUrl,
    string? BannerUrl
);

public record CreateProductDto(
    string Name,
    string Description,
    Guid CategoryId,
    decimal Price,
    int Stock,
    List<string>? Images,
    List<string>? Tags,
    bool? PublishToMarket,
    bool? PublishToStore
);

public record UpdateProductDto(
    string? Name,
    string? Description,
    decimal? Price,
    int? Stock,
    List<string>? Images,
    List<string>? Tags
);

public record PublishToggleDto(bool? PublishToMarket, bool? PublishToStore);
