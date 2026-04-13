namespace api.Domain.Entities;

public class ProductOffer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid MerchantId { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; } = 0;
    public bool PublishToMarket { get; set; } = false;
    public bool PublishToStore { get; set; } = false;
    public double Rating { get; set; } = 0.0;
    public int RatingCount { get; set; } = 0;
    public string? Sku { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Product Product { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
