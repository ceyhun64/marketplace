using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace api.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, ILogger<NotificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public Task SendCourierAssignedNotificationAsync(api.Domain.Entities.Shipment shipment)
    {
        _logger.LogInformation("Kurye atandı bildirimi: ShipmentId={Id}", shipment.Id);
        return Task.CompletedTask;
    }

    public Task SendOrderStatusNotificationAsync(Guid orderId, string status)
    {
        _logger.LogInformation(
            "Sipariş durum bildirimi: OrderId={Id} Status={Status}",
            orderId,
            status
        );
        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string to, string subject, string body)
    {
        // TODO: SendGrid entegrasyonu
        _logger.LogInformation("Email gönderiliyor: {To} | {Subject}", to, subject);
        return Task.CompletedTask;
    }

    public Task SendOrderUpdateNotificationAsync(string userId, string message)
    {
        // TODO: FCM / push notification entegrasyonu
        _logger.LogInformation("Bildirim gönderiliyor: {User} | {Message}", userId, message);
        return Task.CompletedTask;
    }

    public async Task SendShipmentStatusNotificationAsync( // ← EKLENDİ
        Guid shipmentId,
        ShipmentStatus newStatus,
        string? note = null
    )
    {
        try
        {
            var shipment = await _db
                .Shipments.Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.Id == shipmentId);

            if (shipment == null)
                return;

            var message = newStatus switch
            {
                ShipmentStatus.CourierAssigned =>
                    $"Siparişiniz kurye tarafından alınmak üzere. Takip: {shipment.TrackingNumber}",
                ShipmentStatus.PickedUp =>
                    $"Siparişiniz kurye tarafından teslim alındı. Takip: {shipment.TrackingNumber}",
                ShipmentStatus.InTransit => $"Siparişiniz yolda. Takip: {shipment.TrackingNumber}",
                ShipmentStatus.OutForDelivery => "Siparişiniz bugün teslim edilecek!",
                ShipmentStatus.Delivered => "Siparişiniz teslim edildi. İyi alışverişler!",
                ShipmentStatus.Failed =>
                    "Teslimat gerçekleştirilemedi. Lütfen destek ile iletişime geçin.",
                _ => null,
            };

            if (message == null)
                return;

            // TODO: gerçek müşteri e-postası/telefonu DB'den çekilip gönderilecek
            _logger.LogInformation(
                "Shipment {Id} notification: [{Status}] {Message}",
                shipmentId,
                newStatus,
                message
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notification gönderilemedi: ShipmentId={Id}", shipmentId);
        }
    }
}
