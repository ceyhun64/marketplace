using api.Domain.Enums;

namespace api.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public OrderSource Source { get; set; } = OrderSource.Marketplace;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public ShippingRate ShippingRate { get; set; } = ShippingRate.Regular;

    // Shipping Address
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "TR";
    public double DeliveryLatitude { get; set; }
    public double DeliveryLongitude { get; set; }

    // Payment
    public string? PaymentId { get; set; }
    public string? PaymentToken { get; set; }
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }

    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Customer { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public Shipment? Shipment { get; set; }
}
