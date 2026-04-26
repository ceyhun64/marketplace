using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — her 15 dakikada bir çalışır.
/// Kontroller:
///   1. 24h+ PaymentConfirmed → merchant uyarı e-postası
///   2. LabelGenerated &amp; kurye yok 2h+ → admin uyarı log
///   3. İptal edilen son siparişleri say
/// </summary>
public class OrderStatusJob
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<OrderStatusJob> _logger;

    public OrderStatusJob(
        AppDbContext context,
        INotificationService notificationService,
        ILogger<OrderStatusJob> logger
    )
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation("[OrderStatusJob] Başlatıldı: {Time}", DateTime.UtcNow);

        await CheckPaymentConfirmedStaleAsync();
        await CheckPackagingDelayAsync();
        await ValidateCancelledStockRestorationAsync();

        _logger.LogInformation("[OrderStatusJob] Tamamlandı.");
    }

    private async Task CheckPaymentConfirmedStaleAsync()
    {
        var threshold = DateTime.UtcNow.AddDays(-1);
        var staleOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Merchant)
                        .ThenInclude(m => m.User)
            .Where(o => o.Status == OrderStatus.PaymentConfirmed && o.UpdatedAt < threshold)
            .ToListAsync();

        foreach (var order in staleOrders)
        {
            _logger.LogWarning("[OrderStatusJob] 24h+ PaymentConfirmed: OrderId={Id}", order.Id);

            // Merchant bilgisine OrderItems üzerinden ulaşılır (Order'da doğrudan Merchant yok)
            var merchantEmail = order
                .Items.Select(i => i.Product?.Merchant?.User?.Email)
                .FirstOrDefault(e => !string.IsNullOrEmpty(e));

            if (!string.IsNullOrEmpty(merchantEmail))
                await _notificationService.SendEmailAsync(
                    merchantEmail,
                    $"Acil: Sipariş bekleniyor — #{order.Id}",
                    $"Sipariş #{order.Id} hazırlanmayı 24+ saat bekliyor. Lütfen inceleyin."
                );
        }
    }

    private async Task CheckPackagingDelayAsync()
    {
        var threshold = DateTime.UtcNow.AddHours(-2);
        var waiting = await _context
            .Orders.Include(o => o.Shipment)
            .Where(o =>
                o.Status == OrderStatus.LabelGenerated
                && o.Shipment != null
                && o.Shipment.CourierId == null
                && o.UpdatedAt < threshold
            )
            .CountAsync();

        if (waiting > 0)
            _logger.LogWarning("[OrderStatusJob] {Count} sipariş 2h+ kurye bekliyor.", waiting);
    }

    private async Task ValidateCancelledStockRestorationAsync()
    {
        var count = await _context
            .Orders.Where(o =>
                o.Status == OrderStatus.Cancelled && o.UpdatedAt > DateTime.UtcNow.AddHours(-1)
            )
            .CountAsync();

        if (count > 0)
            _logger.LogInformation("[OrderStatusJob] Son 1h: {Count} iptal.", count);
    }
}
