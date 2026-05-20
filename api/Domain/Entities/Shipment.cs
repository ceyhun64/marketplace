using api.Domain.Enums;

namespace api.Domain.Entities;

public class Shipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }

    /// <summary>
    /// Links this shipment to a specific VendorOrder (sub-order).
    /// In a multi-vendor cart, each vendor ships independently — one Shipment per VendorOrder.
    /// </summary>
    public Guid? VendorOrderId { get; set; }

    public Guid? CourierId { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;
    public string TrackingNumber { get; set; } = string.Empty;
    public DateTime EstimatedDelivery { get; set; }
    public string? LabelUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order Order { get; set; } = null!;
    public VendorOrder? VendorOrder { get; set; }
    public Courier? Courier { get; set; }
    public ICollection<ShipmentStatusHistory> StatusHistory { get; set; } =
        new List<ShipmentStatusHistory>();
}
