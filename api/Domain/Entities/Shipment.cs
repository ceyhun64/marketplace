using api.Domain.Enums;

namespace api.Domain.Entities;

public class Shipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid? CourierId { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;
    public string TrackingNumber { get; set; } = string.Empty;
    public DateTime EstimatedDelivery { get; set; }
    public DateTime? ActualDelivery { get; set; }
    public string? LabelUrl { get; set; }
    public string? PickupNote { get; set; }
    public string? DeliveryNote { get; set; }
    public string? RecipientSignature { get; set; }
    public string? DeliveryPhotoUrl { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order Order { get; set; } = null!;
    public Courier? Courier { get; set; }
    public ICollection<ShipmentStatusHistory> StatusHistory { get; set; } =
        new List<ShipmentStatusHistory>();
}
