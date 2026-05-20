using api.Domain.Enums;

namespace api.Domain.Entities;

/// <summary>
/// Dynamic commission rate rules with priority waterfall.
/// Resolution order: (MerchantId + CategoryId + PlanType) → most specific match wins.
/// Null values act as wildcards.
/// </summary>
public class CommissionRule
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>null = applies to all merchants (global default)</summary>
    public Guid? MerchantId { get; set; }

    /// <summary>null = applies to all categories</summary>
    public Guid? CategoryId { get; set; }

    /// <summary>null = applies to all plans</summary>
    public PlanType? PlanType { get; set; }

    public decimal RatePercent { get; set; }

    /// <summary>Higher value = evaluated first. Most specific rules should have the highest priority.</summary>
    public int Priority { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MerchantProfile? Merchant { get; set; }
    public Category? Category { get; set; }
}
