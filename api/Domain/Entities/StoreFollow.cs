namespace api.Domain.Entities;

/// <summary>
/// A customer following a merchant store.
/// Customer ↔ MerchantProfile N:M relationship.
/// </summary>
public class StoreFollow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Guid MerchantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Customer { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
}
