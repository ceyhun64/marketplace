namespace api.Domain.Enums;

public enum OrderStatus
{
    Pending,
    PaymentConfirmed,
    LabelGenerated,
    CourierAssigned,
    PickedUp,
    InTransit,
    OutForDelivery,
    Delivered,
    Failed,
    Cancelled,
}
