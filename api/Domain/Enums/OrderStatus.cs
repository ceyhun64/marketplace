namespace api.Domain.Enums;

public enum OrderStatus
{
    Pending,
    PaymentConfirmed,
    Processing,
    Packed,
    LabelGenerated,
    Shipped,
    CourierAssigned,
    PickedUp,
    InTransit,
    OutForDelivery,
    Delivered,
    Failed,
    Cancelled,
}
