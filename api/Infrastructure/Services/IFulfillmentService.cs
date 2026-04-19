using api.Domain.Entities;
using api.Domain.Enums;

namespace api.Infrastructure.Services;

public interface IFulfillmentService
{
    /// <summary>State machine: mevcut → yeni durum geçişini doğrulayıp uygular,
    /// SignalR bildirimi gönderir ve geçmişe ekler.</summary>
    Task TransitionStatusAsync(Shipment shipment, ShipmentStatus newStatus, string? note = null);

    /// <summary>Yeni sipariş için Shipment kaydı ve tracking numarası oluşturur.</summary>
    Task<Shipment> CreateShipmentForOrderAsync(Order order);
}
