namespace api.Common.DTOs;

public class CourierDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    // Frontend expects "name" (not "fullName")
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // Frontend expects "phone" (not "phoneNumber")
    public string? Phone { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
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
