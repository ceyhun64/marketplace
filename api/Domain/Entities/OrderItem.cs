namespace api.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public Guid MerchantId { get; set; }
    public string ProductName { get; set; } = string.Empty; // snapshot
    public string? ProductImage { get; set; } // snapshot
    public decimal UnitPrice { get; set; } // snapshot
    public int Quantity { get; set; }
    public decimal LineTotal => UnitPrice * Quantity;

    // Navigation
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
