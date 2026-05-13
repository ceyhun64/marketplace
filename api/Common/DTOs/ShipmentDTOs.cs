namespace api.Common.DTOs;

public class ShipmentDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public Guid? CourierId { get; set; }
    public string? CourierName { get; set; }
    public string? CourierPhone { get; set; }
    public string? CourierVehicle { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    // Legacy single field (kept for compatibility)
    public DateTime EstimatedDelivery { get; set; }
    // Detailed pickup/delivery window (matches web Shipment interface)
    public DateTime? EstimatedPickupStart { get; set; }
    public DateTime? EstimatedPickupEnd { get; set; }
    public DateTime? EstimatedDeliveryStart { get; set; }
    public DateTime? EstimatedDeliveryEnd { get; set; }
    public DateTime? ActualDeliveredAt { get; set; }
    public string? LabelUrl { get; set; }
    public string ShippingRate { get; set; } = string.Empty;
    // "events" matches web Shipment.events[]
    public List<ShipmentStatusHistoryDto> Events { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ShipmentStatusHistoryDto
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; }
    // Legacy field (kept for compatibility)
    public DateTime ChangedAt { get; set; }
}

public class AssignCourierDto
{
    public Guid ShipmentId { get; set; }
    public Guid CourierId { get; set; }
}

public class UpdateShipmentStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class PickupConfirmDto
{
    public string? Signature { get; set; }
}

public class DeliveredConfirmDto
{
    public string? RecipientName { get; set; }
    public string? PhotoUrl { get; set; }
}
