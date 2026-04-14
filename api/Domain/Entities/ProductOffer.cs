namespace api.Domain.Entities;

/// <summary>
/// A merchant's listing for a master-catalogue product.
/// One Product can have many ProductOffers from different merchants.
/// </summary>
public class ProductOffer
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid MerchantId { get; set; }
    public MerchantProfile Merchant { get; set; } = null!; // ← needed by BuyBoxService

    public decimal Price { get; set; }
    public int Stock { get; set; }

    public bool PublishToMarket { get; set; }
    public bool PublishToStore { get; set; }

    public double Rating { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
