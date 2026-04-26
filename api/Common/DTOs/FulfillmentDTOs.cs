namespace api.Common.DTOs;

/// <summary>Kurye atama panel listesi için özet DTO</summary>
public class CourierAssignmentSummaryDto
{
    public Guid CourierId { get; set; }
    public string CourierName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? PlateNumber { get; set; }
    public bool IsAvailable { get; set; }
    public int ActiveShipmentCount { get; set; }
}

/// <summary>Admin shipment izleme paneli için özet liste DTO</summary>
public class ShipmentListItemDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? CourierName { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
    public DateTime EstimatedDelivery { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDelayed { get; set; }
}

/// <summary>Kurye portal — atanan paket özeti</summary>
public class CourierShipmentCardDto
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public DateTime EstimatedDelivery { get; set; }
    public string? LabelUrl { get; set; }
    public List<string> ItemNames { get; set; } = [];
}

/// <summary>Webhook event payload — iyzico veya dahili kullanım için</summary>
public class WebhookEventDto
{
    public string Event { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public Guid? ShipmentId { get; set; }
    public string? Status { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, string> Metadata { get; set; } = [];
}

/// <summary>Hangfire gecikmeli teslimat uyarısı için</summary>
public class DelayedShipmentAlertDto
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public DateTime EstimatedDelivery { get; set; }
    public DateTime Now { get; set; }
    public int HoursLate { get; set; }
    public string MerchantEmail { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
}
