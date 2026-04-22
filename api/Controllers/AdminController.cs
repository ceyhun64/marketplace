using api.Common.DTOs; // ← BU SATIRI EKLEYİN
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
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AdminController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfDay = now.Date.ToUniversalTime();

        var totalOrders = await _db.Orders.CountAsync();
        var ordersToday = await _db.Orders.CountAsync(o => o.CreatedAt >= startOfDay);
        var ordersThisMonth = await _db.Orders.CountAsync(o => o.CreatedAt >= startOfMonth);
        var revenueThisMonth =
            await _db
                .Orders.Where(o => o.CreatedAt >= startOfMonth && o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount)
            ?? 0;
        var totalMerchants = await _db.MerchantProfiles.CountAsync();
        var activeMerchants = await _db.MerchantProfiles.CountAsync(m => m.IsActive);
        var totalUsers = await _db.Users.CountAsync();
        var pendingProducts = await _db.Products.CountAsync(p => !p.IsApproved && !p.IsDeleted);
        var activeShipments = await _db.Shipments.CountAsync(s =>
            s.Status != ShipmentStatus.Delivered && s.Status != ShipmentStatus.Failed
        );

        return Ok(
            new
            {
                orders = new
                {
                    totalOrders,
                    ordersToday,
                    ordersThisMonth,
                },
                revenue = new { revenueThisMonth },
                merchants = new { totalMerchants, activeMerchants },
                totalUsers,
                pendingProducts,
                activeShipments,
            }
        );
    }

    // ── MERCHANTS ────────────────────────────────────────────────────────────

    [HttpGet("merchants")]
    public async Task<IActionResult> GetMerchants(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null
    )
    {
        var query = _db
            .MerchantProfiles.Include(m => m.User)
            .Include(m => m.Subscription)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(m =>
                EF.Functions.ILike(m.StoreName, $"%{search}%")
                || EF.Functions.ILike(m.User.Email, $"%{search}%")
            );

        if (isActive.HasValue)
            query = query.Where(m => m.IsActive == isActive.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Slug,
                m.IsActive,
                m.CreatedAt,
                User = new { m.User.Id, m.User.Email },
                Plan = m.Subscription == null ? "none" : m.Subscription.Plan.ToString(),
                ProductCount = m.Products.Count(p => !p.IsDeleted),
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

    [HttpPost("merchants")]
    public async Task<IActionResult> CreateMerchant(
        [FromBody] CreateMerchantDto dto,
        [FromServices] ITokenService tokenService
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            return BadRequest(new { message = "Bu e-posta zaten kayıtlı." });

        if (await _db.MerchantProfiles.AnyAsync(m => m.Slug == dto.Slug))
            return BadRequest(new { message = "Bu slug zaten kullanımda." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Merchant,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow,
        };

        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StoreName = dto.StoreName,
            Slug = dto.Slug,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            HandlingHours = dto.HandlingHours ?? 24,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            null,
            null,
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.Slug,
            }
        );
    }

    [HttpPut("merchants/{id:guid}")]
    public async Task<IActionResult> UpdateMerchant(Guid id, [FromBody] UpdateMerchantDto dto)
    {
        var merchant = await _db.MerchantProfiles.FindAsync(id);
        if (merchant == null)
            return NotFound();

        merchant.StoreName = dto.StoreName ?? merchant.StoreName;
        merchant.Latitude = dto.Latitude ?? merchant.Latitude;
        merchant.Longitude = dto.Longitude ?? merchant.Longitude;
        merchant.HandlingHours = dto.HandlingHours ?? merchant.HandlingHours;
        merchant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.IsActive,
            }
        );
    }

    [HttpPatch("merchants/{id:guid}/suspend")]
    public async Task<IActionResult> ToggleSuspend(Guid id)
    {
        var merchant = await _db.MerchantProfiles.FindAsync(id);
        if (merchant == null)
            return NotFound();

        merchant.IsActive = !merchant.IsActive;
        merchant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(
            new
            {
                merchant.Id,
                merchant.IsActive,
                message = $"Merchant {(merchant.IsActive ? "aktifleştirildi" : "askıya alındı")}.",
            }
        );
    }

    // ── ORDERS ───────────────────────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? merchantId = null
    )
    {
        var query = _db.Orders.Include(o => o.Customer).Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var ps))
            query = query.Where(o => o.Status == ps);

        if (merchantId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.MerchantId == merchantId.Value));

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
                o.Source,
                o.CreatedAt,
                Customer = new { o.Customer.Id, o.Customer.Email },
                ItemCount = o.Items.Count,
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

    [HttpPatch("orders/{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null)
            return NotFound();

        if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
            return BadRequest(new { message = "Geçersiz sipariş durumu." });

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status });
    }

    // ── PRODUCTS ─────────────────────────────────────────────────────────────

    [HttpGet("products/pending")]
    public async Task<IActionResult> GetPendingProducts()
    {
        var pending = await _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => !p.IsApproved && !p.IsDeleted)
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

    [HttpPatch("products/{id:guid}/approve")]
    public async Task<IActionResult> ApproveProduct(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null || product.IsDeleted)
            return NotFound();

        product.IsApproved = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün onaylandı.", product.Id });
    }

    // ── ANALYTICS ────────────────────────────────────────────────────────────

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] string period = "month")
    {
        var from = period switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddDays(-30),
            "year" => DateTime.UtcNow.AddDays(-365),
            _ => DateTime.UtcNow.AddDays(-30),
        };

        var revenue =
            await _db
                .Orders.Where(o => o.CreatedAt >= from && o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount)
            ?? 0;
        var orderCount = await _db.Orders.CountAsync(o => o.CreatedAt >= from);
        var newUsers = await _db.Users.CountAsync(u => u.CreatedAt >= from);

        var dailyOrders = await _db
            .Orders.Where(o => o.CreatedAt >= from)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new
            {
                date = g.Key,
                count = g.Count(),
                revenue = g.Sum(o => o.TotalAmount),
            })
            .OrderBy(g => g.date)
            .ToListAsync();

        return Ok(
            new
            {
                period,
                revenue,
                orderCount,
                newUsers,
                dailyOrders,
            }
        );
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record CreateMerchantDto(
    string Email,
    string Password,
    string StoreName,
    string Slug,
    double Latitude,
    double Longitude,
    int? HandlingHours
);

public record UpdateMerchantDto(
    string? StoreName,
    double? Latitude,
    double? Longitude,
    int? HandlingHours
);

public record UpdateStatusDto(string Status);
