namespace api.Common.DTOs;

public class ShipmentDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid? CourierId { get; set; }
    public string? CourierName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public DateTime EstimatedDelivery { get; set; }
    public string? LabelUrl { get; set; }
    public List<ShipmentStatusHistoryDto> History { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ShipmentStatusHistoryDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
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
