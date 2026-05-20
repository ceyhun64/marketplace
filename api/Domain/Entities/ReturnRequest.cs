namespace api.Domain.Entities;

public enum ReturnStatus
{
    Pending,
    MerchantApproved,
    MerchantRejected,
    Shipped,
    Received,
    Refunded,
    Rejected,
}

/// <summary>
/// Buyer-initiated return request workflow.
/// </summary>
public class ReturnRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid MerchantId { get; set; }

    public ReturnStatus Status { get; set; } = ReturnStatus.Pending;

    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string> Images { get; set; } = new();

    /// <summary>Merchant's response note (approval or rejection reason).</summary>
    public string? MerchantNote { get; set; }
    public DateTime? MerchantRespondedAt { get; set; }

    /// <summary>Carrier tracking number supplied by the customer for return shipment.</summary>
    public string? ReturnTrackingNumber { get; set; }

    public string? StripeRefundId { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTime? RefundedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order Order { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
    public ICollection<ReturnRequestItem> Items { get; set; } = new List<ReturnRequestItem>();
}

public class ReturnRequestItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReturnRequestId { get; set; }
    public Guid OrderItemId { get; set; }
    public int Quantity { get; set; }

    // Navigation
    public ReturnRequest ReturnRequest { get; set; } = null!;
    public OrderItem OrderItem { get; set; } = null!;
}
