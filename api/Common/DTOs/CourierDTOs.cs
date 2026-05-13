namespace api.Common.DTOs;

public class CourierDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    // Alias for frontend compatibility
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    // Alias for frontend compatibility
    public string? PhoneNumber { get; set; }
    public string? VehicleType { get; set; }
    public string? VehiclePlate { get; set; }
    public bool IsActive { get; set; }
    // Web interface uses "isAvailable"
    public bool IsAvailable { get; set; }
    // Web interface uses currentLatitude / currentLongitude
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    // Legacy aliases
    public double? CurrentLat { get; set; }
    public double? CurrentLng { get; set; }
    public int ActiveShipmentCount { get; set; }
    public int TotalDelivered { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCourierDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class UpdateCourierDto
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>Kurye anlık konum güncelleme isteği — PUT /api/couriers/me/location</summary>
public class CourierLocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
