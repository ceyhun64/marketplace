namespace api.Domain.Entities;

public class Referral
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReferrerId { get; set; }
    public Guid ReferredUserId { get; set; }
    public string Status { get; set; } = "pending"; // "pending" | "completed"
    public decimal EarnedAmount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public User Referrer { get; set; } = null!;
    public User ReferredUser { get; set; } = null!;
}
