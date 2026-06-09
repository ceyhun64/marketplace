namespace api.Domain.Entities;

/// <summary>
/// Immutable audit trail for security-sensitive operations:
/// admin actions, financial transactions, status changes.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>User who performed the action (null = system/background job).</summary>
    public Guid? ActorId { get; set; }
    public string? ActorEmail { get; set; }

    /// <summary>e.g. "order.status_changed", "withdrawal.approved", "merchant.approved"</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>e.g. "Order", "WithdrawalRequest", "MerchantProfile"</summary>
    public string ResourceType { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;

    /// <summary>JSON snapshot of relevant old state (nullable).</summary>
    public string? OldValue { get; set; }

    /// <summary>JSON snapshot of relevant new state (nullable).</summary>
    public string? NewValue { get; set; }

    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
