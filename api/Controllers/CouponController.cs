using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/coupon")]
public class CouponController : ControllerBase
{
    private readonly AppDbContext _db;

    public CouponController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("validate")]
    [Authorize]
    public async Task<IActionResult> Validate([FromBody] ValidateCouponDto dto)
    {
        var code = dto.Code.Trim().ToUpperInvariant();

        var coupon = await _db.Coupons
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

        if (coupon == null)
            return NotFound(new { message = "Coupon code not found or inactive." });

        if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < DateTime.UtcNow)
            return BadRequest(new { message = "This coupon has expired." });

        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
            return BadRequest(new { message = "This coupon has reached its usage limit." });

        if (dto.OrderTotal < coupon.MinOrderAmount)
            return BadRequest(new { message = $"Minimum order amount is ${coupon.MinOrderAmount:F2}." });

        decimal discount;
        if (coupon.DiscountType == "percentage")
        {
            discount = dto.OrderTotal * (coupon.DiscountValue / 100m);
            if (coupon.MaxDiscount.HasValue)
                discount = Math.Min(discount, coupon.MaxDiscount.Value);
        }
        else
        {
            discount = coupon.DiscountValue;
        }

        discount = Math.Min(discount, dto.OrderTotal);

        return Ok(new
        {
            coupon.Id,
            coupon.Code,
            coupon.DiscountType,
            coupon.DiscountValue,
            coupon.MaxDiscount,
            calculatedDiscount = Math.Round(discount, 2),
        });
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll()
    {
        var coupons = await _db.Coupons
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id, c.Code, c.DiscountType, c.DiscountValue, c.MaxDiscount,
                c.MinOrderAmount, c.UsageLimit, c.UsageCount, c.ExpiresAt,
                c.IsActive, c.CreatedAt,
            })
            .ToListAsync();

        return Ok(coupons);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreateCouponDto dto)
    {
        var code = dto.Code.Trim().ToUpperInvariant();

        if (await _db.Coupons.AnyAsync(c => c.Code == code))
            return BadRequest(new { message = "Coupon code already exists." });

        var coupon = new Coupon
        {
            Code = code,
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MaxDiscount = dto.MaxDiscount,
            MinOrderAmount = dto.MinOrderAmount,
            UsageLimit = dto.UsageLimit,
            ExpiresAt = dto.ExpiresAt,
            IsActive = true,
        };

        _db.Coupons.Add(coupon);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = coupon.Id }, coupon);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var coupon = await _db.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();

        _db.Coupons.Remove(coupon);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record ValidateCouponDto(string Code, decimal OrderTotal);
public record CreateCouponDto(
    string Code,
    string DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    decimal MinOrderAmount,
    int? UsageLimit,
    DateTime? ExpiresAt
);
