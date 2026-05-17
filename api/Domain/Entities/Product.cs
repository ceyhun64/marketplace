namespace api.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public Guid CategoryId { get; set; }
    public List<string> Images { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool PublishToMarket { get; set; } = false;
    public bool PublishToStore { get; set; } = true;
    public bool IsApproved { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation — many-to-one
    public MerchantProfile Merchant { get; set; } = null!;
    public Category Category { get; set; } = null!;

    // Navigation — one-to-many
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
