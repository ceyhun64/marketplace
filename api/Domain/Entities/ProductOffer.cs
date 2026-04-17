namespace api.Domain.Entities;

public class ProductOffer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid MerchantId { get; set; }
    public MerchantProfile Merchant { get; set; } = null!;

    public decimal Price { get; set; }
    public int Stock { get; set; }

    public bool IsActive { get; set; } = true; // ← EKLENDİ

    public bool PublishToMarket { get; set; }
    public bool PublishToStore { get; set; }

    public double Rating { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
