namespace api.Domain.Entities;

public enum DisputeStatus
{
    Open,
    UnderReview,
    AwaitingBuyerResponse,
    AwaitingMerchantResponse,
    ResolvedBuyer,
    ResolvedMerchant,
    Escalated,
    Closed,
}

public enum DisputeReason
{
    ItemNotReceived,
    ItemNotAsDescribed,
    WrongItemSent,
    DamagedItem,
    RefundNotReceived,
    Other,
}

/// <summary>
/// Buyer-merchant dispute escalation system.
/// Required by Turkish e-commerce law (ETBİS regulations) for marketplace operators.
/// </summary>
public class Dispute
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid InitiatedByCustomerId { get; set; }
    public Guid MerchantId { get; set; }

    public DisputeReason Reason { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> EvidenceImages { get; set; } = new();

    public DisputeStatus Status { get; set; } = DisputeStatus.Open;

    public string? AdminResolution { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order Order { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
    public ICollection<DisputeMessage> Messages { get; set; } = new List<DisputeMessage>();
}

public class DisputeMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DisputeId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderRole { get; set; } = string.Empty; // "Customer", "Merchant", "Admin"
    public string Message { get; set; } = string.Empty;
    public List<string> Attachments { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Dispute Dispute { get; set; } = null!;
}
