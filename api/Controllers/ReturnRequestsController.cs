using System.Data;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Buyer-initiated return request workflow.
/// State machine: Pending → MerchantApproved / MerchantRejected → Shipped → Received → Refunded | Rejected
/// </summary>
[ApiController]
[Route("api/returns")]
[Authorize]
public class ReturnRequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IPaymentService _payment;
    private readonly INotificationService _notifications;

    public ReturnRequestsController(
        AppDbContext db,
        ICurrentUserService currentUser,
        IPaymentService payment,
        INotificationService notifications
    )
    {
        _db = db;
        _currentUser = currentUser;
        _payment = payment;
        _notifications = notifications;
    }

    // ── CUSTOMER: Create return request ──────────────────────────────────────

    /// <summary>POST /api/returns — Customer initiates a return.</summary>
    [HttpPost]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> Create([FromBody] CreateReturnRequestDto dto)
    {
        var order = await _db
            .Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.CustomerId == _currentUser.UserId);

        if (order == null)
            return NotFound(new { message = "Sipariş bulunamadı." });

        if (order.Status != OrderStatus.Delivered)
            return BadRequest(
                new { message = "Yalnızca teslim edilmiş siparişler için iade açılabilir." }
            );

        // Validate each requested return item belongs to this order
        var returnItemIds = dto.Items.Select(i => i.OrderItemId).ToList();
        var orderItemIds = order.Items.Select(i => i.Id).ToHashSet();
        if (!returnItemIds.All(id => orderItemIds.Contains(id)))
            return BadRequest(
                new { message = "İade edilmek istenen ürünlerden biri bu siparişe ait değil." }
            );

        // One return request per merchant per order
        var merchantId = order
            .Items.Where(i => returnItemIds.Contains(i.Id))
            .Select(i => i.MerchantId)
            .Distinct()
            .FirstOrDefault();

        var existing = await _db.ReturnRequests.AnyAsync(r =>
            r.OrderId == dto.OrderId
            && r.MerchantId == merchantId
            && r.Status != ReturnStatus.Rejected
            && r.Status != ReturnStatus.MerchantRejected
        );

        if (existing)
            return Conflict(new { message = "Bu sipariş için zaten aktif bir iade talebi var." });

        var returnRequest = new ReturnRequest
        {
            Id = Guid.NewGuid(),
            OrderId = dto.OrderId,
            CustomerId = _currentUser.UserId,
            MerchantId = merchantId,
            Status = ReturnStatus.Pending,
            Reason = dto.Reason,
            Description = dto.Description,
            Images = dto.Images ?? new List<string>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Items = dto
                .Items.Select(i => new ReturnRequestItem
                {
                    Id = Guid.NewGuid(),
                    OrderItemId = i.OrderItemId,
                    Quantity = i.Quantity,
                })
                .ToList(),
        };

        _db.ReturnRequests.Add(returnRequest);
        await _db.SaveChangesAsync();

        // Notify the merchant
        await _notifications.SendAsync(
            (
                await _db
                    .MerchantProfiles.Where(m => m.Id == merchantId)
                    .Select(m => m.UserId)
                    .FirstAsync()
            ),
            "Yeni iade talebi",
            $"Sipariş #{dto.OrderId} için yeni bir iade talebi var."
        );

        return Ok(new { id = returnRequest.Id, message = "İade talebiniz oluşturuldu." });
    }

    /// <summary>GET /api/returns — Customer's own return requests.</summary>
    [HttpGet]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> GetMine()
    {
        var list = await _db
            .ReturnRequests.Where(r => r.CustomerId == _currentUser.UserId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReturnRequestSummaryDto
            {
                Id = r.Id,
                OrderId = r.OrderId,
                Status = r.Status.ToString(),
                Reason = r.Reason,
                RefundAmount = r.RefundAmount,
                CreatedAt = r.CreatedAt,
            })
            .ToListAsync();

        return Ok(list);
    }

    // ── MERCHANT: Approve / Reject ────────────────────────────────────────────

    /// <summary>GET /api/returns/merchant — Merchant's pending return requests.</summary>
    [HttpGet("merchant")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMerchantReturns([FromQuery] string? status)
    {
        var merchantId =
            _currentUser.MerchantId
            ?? (
                await _db
                    .MerchantProfiles.Where(m => m.UserId == _currentUser.UserId)
                    .Select(m => m.Id)
                    .FirstOrDefaultAsync()
            );

        var query = _db.ReturnRequests.Where(r => r.MerchantId == merchantId);

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<ReturnStatus>(status, ignoreCase: true, out var s)
        )
            query = query.Where(r => r.Status == s);

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReturnRequestSummaryDto
            {
                Id = r.Id,
                OrderId = r.OrderId,
                Status = r.Status.ToString(),
                Reason = r.Reason,
                RefundAmount = r.RefundAmount,
                CreatedAt = r.CreatedAt,
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>POST /api/returns/{id}/approve — Merchant approves the return.</summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] MerchantRespondDto dto)
    {
        var merchantId =
            _currentUser.MerchantId
            ?? (
                await _db
                    .MerchantProfiles.Where(m => m.UserId == _currentUser.UserId)
                    .Select(m => m.Id)
                    .FirstOrDefaultAsync()
            );

        var ret = await _db
            .ReturnRequests.Include(r => r.Items)
                .ThenInclude(i => i.OrderItem)
            .FirstOrDefaultAsync(r => r.Id == id && r.MerchantId == merchantId);

        if (ret == null)
            return NotFound();
        if (ret.Status != ReturnStatus.Pending)
            return BadRequest(new { message = "Yalnızca bekleyen talepler onaylanabilir." });

        ret.Status = ReturnStatus.MerchantApproved;
        ret.MerchantNote = dto.Note;
        ret.MerchantRespondedAt = DateTime.UtcNow;
        ret.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notifications.SendAsync(
            ret.CustomerId,
            "İade talebiniz onaylandı",
            "Satıcı iade talebinizi onayladı. Lütfen ürünü iade adresine gönderin."
        );

        return Ok(new { message = "İade talebi onaylandı." });
    }

    /// <summary>POST /api/returns/{id}/reject — Merchant rejects the return.</summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] MerchantRespondDto dto)
    {
        var merchantId =
            _currentUser.MerchantId
            ?? (
                await _db
                    .MerchantProfiles.Where(m => m.UserId == _currentUser.UserId)
                    .Select(m => m.Id)
                    .FirstOrDefaultAsync()
            );

        var ret = await _db.ReturnRequests.FirstOrDefaultAsync(r =>
            r.Id == id && r.MerchantId == merchantId
        );

        if (ret == null)
            return NotFound();
        if (ret.Status != ReturnStatus.Pending)
            return BadRequest(new { message = "Yalnızca bekleyen talepler reddedilebilir." });

        ret.Status = ReturnStatus.MerchantRejected;
        ret.MerchantNote = dto.Note;
        ret.MerchantRespondedAt = DateTime.UtcNow;
        ret.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notifications.SendAsync(
            ret.CustomerId,
            "İade talebiniz reddedildi",
            dto.Note ?? string.Empty
        );
        return Ok(new { message = "İade talebi reddedildi." });
    }

    /// <summary>POST /api/returns/{id}/shipping — Customer adds return tracking number.</summary>
    [HttpPost("{id:guid}/shipping")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> AddShipping(Guid id, [FromBody] AddShippingDto dto)
    {
        var ret = await _db.ReturnRequests.FirstOrDefaultAsync(r =>
            r.Id == id && r.CustomerId == _currentUser.UserId
        );

        if (ret == null)
            return NotFound();
        if (ret.Status != ReturnStatus.MerchantApproved)
            return BadRequest(new { message = "İade henüz onaylanmadı." });

        ret.ReturnTrackingNumber = dto.TrackingNumber;
        ret.Status = ReturnStatus.Shipped;
        ret.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Takip numarası kaydedildi." });
    }

    // ── ADMIN: Mark received + process refund ─────────────────────────────────

    /// <summary>POST /api/returns/{id}/receive — Admin marks item as received and triggers refund.</summary>
    [HttpPost("{id:guid}/receive")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> MarkReceived(Guid id)
    {
        var ret = await _db
            .ReturnRequests.Include(r => r.Items)
                .ThenInclude(i => i.OrderItem)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (ret == null)
            return NotFound();
        if (ret.Status != ReturnStatus.Shipped)
            return BadRequest(new { message = "Ürün henüz kargoya verilmemiş." });

        ret.Status = ReturnStatus.Received;
        ret.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Calculate partial refund amount at item level
        var refundAmount = ret.Items.Sum(i => i.OrderItem.UnitPrice * i.Quantity);
        ret.RefundAmount = refundAmount;

        // Trigger Stripe partial refund
        var refundResult = await _payment.RefundAsync(
            ret.OrderId,
            new Common.DTOs.RefundRequestDto { Amount = refundAmount, Reason = "return" }
        );

        if (!refundResult.Success)
            return BadRequest(new { message = $"İade ödeme hatası: {refundResult.Message}" });

        // Restore variant/product stock
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            foreach (var item in ret.Items)
            {
                if (item.OrderItem.VariantId.HasValue)
                {
                    await _db
                        .ProductVariants.Where(v => v.Id == item.OrderItem.VariantId.Value)
                        .ExecuteUpdateAsync(s =>
                            s.SetProperty(v => v.Stock, v => v.Stock + item.Quantity)
                                .SetProperty(v => v.UpdatedAt, DateTime.UtcNow)
                        );
                }
                else
                {
                    await _db
                        .Products.Where(p => p.Id == item.OrderItem.ProductId)
                        .ExecuteUpdateAsync(s =>
                            s.SetProperty(p => p.Stock, p => p.Stock + item.Quantity)
                                .SetProperty(p => p.UpdatedAt, DateTime.UtcNow)
                        );
                }
            }

            ret.Status = ReturnStatus.Refunded;
            ret.RefundedAt = DateTime.UtcNow;
            ret.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        await _notifications.SendAsync(
            ret.CustomerId,
            "İade işleminiz tamamlandı",
            $"{refundAmount:C} tutarındaki iadeniz işleme alındı."
        );

        return Ok(new { message = "İade alındı ve ödeme iade edildi.", refundAmount });
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public class CreateReturnRequestDto
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string>? Images { get; set; }
    public List<ReturnItemDto> Items { get; set; } = new();
}

public class ReturnItemDto
{
    public Guid OrderItemId { get; set; }
    public int Quantity { get; set; }
}

public class MerchantRespondDto
{
    public string? Note { get; set; }
}

public class AddShippingDto
{
    public string TrackingNumber { get; set; } = string.Empty;
}

public class ReturnRequestSummaryDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal? RefundAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}
