using api.Domain.Enums;

namespace api.Domain.Entities;

/// <summary>
/// Sub-order scoped to a single merchant within a parent customer Order.
/// One parent Order → N VendorOrders (one per distinct merchant in the cart).
/// Stripe payment is on the parent; VendorOrder tracks the merchant's portion only.
/// </summary>
public class VendorOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Parent order (holds the Stripe payment).</summary>
    public Guid OrderId { get; set; }

    public Guid MerchantId { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    /// <summary>Sum of line totals for this merchant's items (before platform fee).</summary>
    public decimal SubTotal { get; set; }

    /// <summary>Platform commission amount deducted at settlement.</summary>
    public decimal PlatformFee { get; set; }

    /// <summary>Amount the merchant will receive after fee deduction.</summary>
    public decimal MerchantNetAmount { get; set; }

    /// <summary>Set when the order is marked DELIVERED and funds clear the holding period.</summary>
    public DateTime? SettledAt { get; set; }

    /// <summary>Number of automatic courier dispatch attempts made so far.</summary>
    public int DispatchAttempts { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ─────────────────────────────────────────────────────────────
    public Order Order { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
