using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — her saat çalışır.
/// EstimatedDelivery süresi geçmiş ve teslim edilmemiş
/// shipment'ları tespit edip merchant + müşteriye bildirim gönderir.
/// </summary>
public class DelayedShipmentJob
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<DelayedShipmentJob> _logger;

    public DelayedShipmentJob(
        AppDbContext context,
        INotificationService notificationService,
        ILogger<DelayedShipmentJob> logger
    )
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation(
            "[DelayedShipmentJob] Gecikmiş kargo kontrolü başlatıldı: {Time}",
            DateTime.UtcNow
        );

        var activeStatuses = new[]
        {
            ShipmentStatus.CourierAssigned,
            ShipmentStatus.PickedUp,
            ShipmentStatus.InTransit,
            ShipmentStatus.OutForDelivery,
        };

        var delayedShipments = await _context
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .Include(s => s.Order)
                .ThenInclude(o => o.Merchant)
                    .ThenInclude(m => m.User)
            .Where(s =>
                activeStatuses.Contains(s.Status) && s.EstimatedDelivery < DateTime.UtcNow
            )
            .ToListAsync();

        _logger.LogInformation(
            "[DelayedShipmentJob] {Count} gecikmiş kargo bulundu.",
            delayedShipments.Count
        );

        foreach (var shipment in delayedShipments)
        {
            var hoursLate = (int)Math.Ceiling(
                (DateTime.UtcNow - shipment.EstimatedDelivery).TotalHours
            );

            _logger.LogWarning(
                "[DelayedShipmentJob] Gecikmiş Shipment={Id} TrackingNo={TrackingNo} HoursLate={Hours}",
                shipment.Id,
                shipment.TrackingNumber,
                hoursLate
            );

            // Müşteriye bildirim
            var customerEmail = shipment.Order?.Customer?.Email;
            if (!string.IsNullOrEmpty(customerEmail))
            {
                await _notificationService.SendEmailAsync(
                    customerEmail,
                    $"Kargo Gecikmesi — Takip: {shipment.TrackingNumber}",
                    $"Siparişinizin teslimatı {hoursLate} saat gecikmektedir. "
                        + $"Takip numaranız: {shipment.TrackingNumber}. "
                        + "Destek için bize ulaşabilirsiniz."
                );
            }

            // Merchant'a bildirim
            var merchantEmail = shipment.Order?.Merchant?.User?.Email;
            if (!string.IsNullOrEmpty(merchantEmail))
            {
                await _notificationService.SendEmailAsync(
                    merchantEmail,
                    $"Kargo Gecikmesi Uyarısı — Sipariş #{shipment.OrderId}",
                    $"Sipariş #{shipment.OrderId} için kargo {hoursLate} saat gecikmiş görünüyor. "
                        + $"Takip no: {shipment.TrackingNumber}. Kurye ile iletişime geçin."
                );
            }

            // SignalR bildirim (OrderStatusNotification)
            await _notificationService.SendOrderStatusNotificationAsync(
                shipment.OrderId,
                $"Kargo gecikmesi tespit edildi. Takip: {shipment.TrackingNumber}"
            );
        }

        _logger.LogInformation("[DelayedShipmentJob] Tamamlandı.");
    }
}
