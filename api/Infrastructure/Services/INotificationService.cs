using api.Domain.Enums;

namespace api.Infrastructure.Services;

public interface INotificationService
{
    Task SendEmailAsync(string to, string subject, string body);

    /// <summary>FulfillmentService tarafından state machine geçişlerinde çağrılır.</summary>
    Task SendOrderUpdateNotificationAsync(string userId, string message);

    /// <summary>Kargo durum değişikliklerinde e-posta + SMS gönderir.</summary>
    Task SendShipmentStatusNotificationAsync(
        Guid shipmentId,
        ShipmentStatus newStatus,
        string? note = null
    ); // ← EKLENDİ

    Task SendCourierAssignedNotificationAsync(api.Domain.Entities.Shipment shipment);
    Task SendOrderStatusNotificationAsync(Guid orderId, string status);
}
