using api.Domain.Enums;

namespace api.Domain.Entities;

public class Shipment
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!; // ← needed by LabelGeneratorService

    public Guid? CourierId { get; set; }
    public Courier? Courier { get; set; }

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;

    public string TrackingNumber { get; set; } = string.Empty; // ← needed by LabelGeneratorService

    public DateTime EstimatedDelivery { get; set; }

    public string? LabelUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ShipmentStatusHistory> StatusHistory { get; set; } = [];
}
