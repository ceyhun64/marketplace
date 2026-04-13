namespace api.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid OfferId { get; set; }
    public Guid MerchantId { get; set; }
    public string ProductName { get; set; } = string.Empty; // snapshot at order time
    public string? ProductImage { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;

    // Navigation
    public Order Order { get; set; } = null!;
    public ProductOffer Offer { get; set; } = null!;
}
