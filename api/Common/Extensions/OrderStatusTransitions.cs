using api.Domain.Enums;

namespace api.Common.Extensions;

/// <summary>
/// Defines the allowed forward transitions for order status updates.
/// Admin-only: prevents arbitrary jumps (e.g. Pending → Delivered).
/// </summary>
public static class OrderStatusTransitions
{
    private static readonly Dictionary<OrderStatus, HashSet<OrderStatus>> _allowed = new()
    {
        [OrderStatus.Pending]          = [OrderStatus.PaymentConfirmed, OrderStatus.Cancelled, OrderStatus.Failed],
        [OrderStatus.PaymentConfirmed] = [OrderStatus.Processing, OrderStatus.Cancelled],
        [OrderStatus.Processing]       = [OrderStatus.Packed, OrderStatus.Cancelled],
        [OrderStatus.Packed]           = [OrderStatus.LabelGenerated, OrderStatus.Cancelled],
        [OrderStatus.LabelGenerated]   = [OrderStatus.CourierAssigned, OrderStatus.Cancelled],
        [OrderStatus.CourierAssigned]  = [OrderStatus.PickedUp, OrderStatus.Cancelled],
        [OrderStatus.PickedUp]         = [OrderStatus.InTransit, OrderStatus.Cancelled],
        [OrderStatus.InTransit]        = [OrderStatus.OutForDelivery, OrderStatus.Failed],
        [OrderStatus.OutForDelivery]   = [OrderStatus.Delivered, OrderStatus.Failed],
        [OrderStatus.Delivered]        = [],
        [OrderStatus.Failed]           = [OrderStatus.Processing],
        [OrderStatus.Cancelled]        = [],
        [OrderStatus.Shipped]          = [OrderStatus.InTransit, OrderStatus.OutForDelivery, OrderStatus.Failed],
    };

    public static bool IsAllowed(OrderStatus current, OrderStatus next) =>
        current == next || (_allowed.TryGetValue(current, out var allowed) && allowed.Contains(next));
}
