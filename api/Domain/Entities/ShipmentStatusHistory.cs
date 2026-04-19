using api.Domain.Enums;

namespace api.Domain.Entities;

public class ShipmentStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ShipmentId { get; set; }
    public ShipmentStatus Status { get; set; }
    public string? Note { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow; // ← CreatedAt → ChangedAt (FulfillmentService ile uyumlu)

    // Navigation
    public Shipment Shipment { get; set; } = null!;
}
