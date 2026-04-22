using api.Domain.Enums;

namespace api.Domain.Entities;

public class ShipmentStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ShipmentId { get; set; }
    public ShipmentStatus Status { get; set; }
    public string? Note { get; set; }
    public string? Location { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedById { get; set; }

    // Navigation
    public Shipment Shipment { get; set; } = null!;
}
