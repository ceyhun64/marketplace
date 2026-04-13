namespace api.Domain.Entities;

public class Courier
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string VehicleType { get; set; } = "Motorcycle"; // Motorcycle, Car, Bicycle
    public string? PlateNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsAvailable { get; set; } = true;
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public DateTime? LastLocationUpdate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}
