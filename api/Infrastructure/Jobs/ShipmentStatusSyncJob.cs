using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — her 30 dakikada bir çalışır.
/// Shipment.Status = Delivered olan ama Order.Status != Delivered
/// olan tutarsızlıkları tespit edip düzeltir.
/// Aynı zamanda LabelGenerated durumundaki siparişleri
/// courier atanmamışsa admin dashboard'a uyarı ekler.
/// </summary>
public class ShipmentStatusSyncJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<ShipmentStatusSyncJob> _logger;

    public ShipmentStatusSyncJob(AppDbContext context, ILogger<ShipmentStatusSyncJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation(
            "[ShipmentStatusSyncJob] Durum senkronizasyonu başlatıldı: {Time}",
            DateTime.UtcNow
        );

        await SyncDeliveredOrdersAsync();
        await WarnUnassignedShipmentsAsync();

        _logger.LogInformation("[ShipmentStatusSyncJob] Tamamlandı.");
    }

    private async Task SyncDeliveredOrdersAsync()
    {
        // Teslim edilmiş ama order.Status güncellenmeyen durumları düzelt
        var mismatchedShipments = await _context
            .Shipments.Include(s => s.Order)
            .Where(s =>
                s.Status == ShipmentStatus.Delivered
                && s.Order != null
                && s.Order.Status != OrderStatus.Delivered
            )
            .ToListAsync();

        if (mismatchedShipments.Count > 0)
        {
            _logger.LogWarning(
                "[ShipmentStatusSyncJob] {Count} uyumsuz sipariş düzeltiliyor.",
                mismatchedShipments.Count
            );

            foreach (var shipment in mismatchedShipments)
            {
                if (shipment.Order != null)
                {
                    shipment.Order.Status = OrderStatus.Delivered;
                    shipment.Order.UpdatedAt = DateTime.UtcNow;
                    _logger.LogInformation(
                        "[ShipmentStatusSyncJob] Order {OrderId} Delivered olarak güncellendi.",
                        shipment.OrderId
                    );
                }
            }

            await _context.SaveChangesAsync();
        }
    }

    private async Task WarnUnassignedShipmentsAsync()
    {
        // 2 saatten uzun süredir kurye atanmamış (LabelGenerated) shipment'ları logla
        var threshold = DateTime.UtcNow.AddHours(-2);

        var unassigned = await _context
            .Shipments.Where(s =>
                s.Status == ShipmentStatus.LabelGenerated
                && s.CourierId == null
                && s.UpdatedAt < threshold
            )
            .ToListAsync();

        foreach (var shipment in unassigned)
        {
            _logger.LogWarning(
                "[ShipmentStatusSyncJob] Kurye atanmamış Shipment={Id} TrackingNo={TrackingNo} ({Hours:F1} saat bekleniyor)",
                shipment.Id,
                shipment.TrackingNumber,
                (DateTime.UtcNow - shipment.UpdatedAt).TotalHours
            );
        }
    }
}
