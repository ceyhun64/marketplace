namespace api.Domain.Enums;

public enum ShipmentStatus
{
    Pending,
    LabelGenerated,
    CourierAssigned,
    PickedUp,
    InTransit,
    OutForDelivery,
    Delivered,
    Failed,
}
