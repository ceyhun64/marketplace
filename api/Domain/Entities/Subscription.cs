using api.Domain.Enums;

namespace api.Domain.Entities;

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public PlanType Plan { get; set; } = PlanType.Basic;
    public decimal MonthlyPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public string? PaymentId { get; set; }
    public bool AutoRenew { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MerchantProfile Merchant { get; set; } = null!;
}
