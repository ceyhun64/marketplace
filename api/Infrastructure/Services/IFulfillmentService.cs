using api.Domain.Entities;
using api.Domain.Enums;

namespace api.Infrastructure.Services;

public interface IFulfillmentService
{
    /// <summary>State machine: mevcut → yeni durum geçişini doğrulayıp uygular,
    /// SignalR bildirimi gönderir ve geçmişe ekler.</summary>
    Task TransitionStatusAsync(Shipment shipment, ShipmentStatus newStatus, string? note = null);

    /// <summary>
    /// Legacy: creates a single shipment for the whole order.
    /// Use <see cref="CreateShipmentForVendorOrderAsync"/> for multi-vendor orders.
    /// </summary>
    Task<Shipment> CreateShipmentForOrderAsync(Order order);

    /// <summary>
    /// Creates an independent shipment record scoped to one VendorOrder.
    /// Each vendor's items get a separate tracking number so they can be
    /// dispatched, tracked, and delivered independently.
    /// </summary>
    Task<Shipment> CreateShipmentForVendorOrderAsync(VendorOrder vendorOrder, Order order);
}
