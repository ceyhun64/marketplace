using api.Domain.Enums;

namespace api.Domain.Entities;

public class Shipment
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid? CourierId { get; set; }
    public Courier? Courier { get; set; }

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;

    public string TrackingNumber { get; set; } = string.Empty;

    public DateTime EstimatedDelivery { get; set; }

    public string? LabelUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // ← eklendi

    public ICollection<ShipmentStatusHistory> StatusHistory { get; set; } = [];
}
