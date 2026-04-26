using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — her dakika çalışır.
/// Görevler:
///   1. Yeni sipariş bildirimleri — merchant'a "yeni sipariş var" e-postası
///   2. Teslim edilen sipariş teşekkür e-postası (delivered, henüz gönderilmemiş)
///   3. İptal bildirimleri (Cancelled, son 5 dakika)
/// </summary>
public class NotificationJob
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationJob> _logger;

    public NotificationJob(
        AppDbContext context,
        INotificationService notificationService,
        ILogger<NotificationJob> logger
    )
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation("[NotificationJob] Başlatıldı: {Time}", DateTime.UtcNow);

        await NotifyMerchantsForNewOrdersAsync();
        await SendDeliveryThankYouAsync();
        await NotifyCancelledOrdersAsync();

        _logger.LogInformation("[NotificationJob] Tamamlandı.");
    }

    // ── 1. Yeni siparişlerde merchant'a bildirim ────────────────────────────

    /// <summary>
    /// Son 2 dakikada oluşturulmuş ve ödeme onaylı siparişleri bulur,
    /// ilgili merchant'a "yeni sipariş" e-postası gönderir.
    /// (Hangfire dakikada bir çalıştığından 2 dakikalık pencere yeterli buffer sağlar.)
    /// </summary>
    private async Task NotifyMerchantsForNewOrdersAsync()
    {
        var since = DateTime.UtcNow.AddMinutes(-2);

        var newOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Merchant)
                        .ThenInclude(m => m.User)
            .Where(o =>
                o.Status == OrderStatus.PaymentConfirmed
                && o.CreatedAt >= since
            )
            .ToListAsync();

        if (newOrders.Count == 0)
            return;

        _logger.LogInformation(
            "[NotificationJob] {Count} yeni sipariş bildirimi gönderiliyor.",
            newOrders.Count
        );

        foreach (var order in newOrders)
        {
            // Her siparişteki tüm merchant'ları bul (genelde tek merchant)
            var merchantEmails = order
                .Items.Select(i => i.Product?.Merchant?.User?.Email)
                .Where(e => !string.IsNullOrEmpty(e))
                .Distinct()
                .ToList();

            foreach (var email in merchantEmails)
            {
                if (email == null)
                    continue;

                var shortId = order.Id.ToString()[..8].ToUpper();
                var itemCount = order.Items.Count;
                var total = order.TotalAmount;

                await _notificationService.SendEmailAsync(
                    email,
                    $"🛒 Yeni Sipariş — #{shortId}",
                    $"""
                    Yeni bir siparişiniz var!

                    Sipariş No: #{shortId}
                    Müşteri: {order.Customer?.FirstName} {order.Customer?.LastName}
                    Ürün Sayısı: {itemCount}
                    Toplam: {total:C2}
                    Kargo: {order.ShippingRate}

                    Siparişi hazırlamak için merchant panelinize giriş yapın.
                    """
                );

                _logger.LogInformation(
                    "[NotificationJob] Merchant bildirildi: {Email} — Order={OrderId}",
                    email,
                    order.Id
                );
            }
        }
    }

    // ── 2. Teslim sonrası teşekkür e-postası ───────────────────────────────

    /// <summary>
    /// Son 5 dakikada Delivered olan siparişler için müşteriye
    /// teşekkür e-postası gönderir.
    /// </summary>
    private async Task SendDeliveryThankYouAsync()
    {
        var since = DateTime.UtcNow.AddMinutes(-5);

        var deliveredOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Where(o =>
                o.Status == OrderStatus.Delivered
                && o.UpdatedAt >= since
            )
            .ToListAsync();

        foreach (var order in deliveredOrders)
        {
            if (order.Customer == null)
                continue;

            var shortId = order.Id.ToString()[..8].ToUpper();
            var firstProduct = order.Items.FirstOrDefault()?.ProductName ?? "ürününüz";

            await _notificationService.SendEmailAsync(
                order.Customer.Email,
                $"Teşekkürler! Siparişiniz teslim edildi — #{shortId}",
                $"""
                Merhaba {order.Customer.FirstName},

                #{shortId} numaralı siparişiniz başarıyla teslim edildi! 🎉

                "{firstProduct}" ve diğer ürünlerinizin tadını çıkarın.

                Değerlendirme yapmak için hesabınıza giriş yapabilirsiniz.

                İyi günler dileriz!
                """
            );

            _logger.LogInformation(
                "[NotificationJob] Teşekkür e-postası gönderildi: {Email} — Order={OrderId}",
                order.Customer.Email,
                order.Id
            );
        }
    }

    // ── 3. İptal bildirimi ──────────────────────────────────────────────────

    /// <summary>
    /// Son 5 dakikada iptal edilen siparişler için hem müşteriye
    /// hem merchant'a bildirim gönderir.
    /// </summary>
    private async Task NotifyCancelledOrdersAsync()
    {
        var since = DateTime.UtcNow.AddMinutes(-5);

        var cancelledOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Merchant)
                        .ThenInclude(m => m.User)
            .Where(o =>
                o.Status == OrderStatus.Cancelled
                && o.UpdatedAt >= since
            )
            .ToListAsync();

        foreach (var order in cancelledOrders)
        {
            if (order.Customer == null)
                continue;

            var shortId = order.Id.ToString()[..8].ToUpper();
            var reason = string.IsNullOrEmpty(order.CancellationReason)
                ? "Belirtilmedi"
                : order.CancellationReason;

            // Müşteriye bildirim
            await _notificationService.SendEmailAsync(
                order.Customer.Email,
                $"Siparişiniz İptal Edildi — #{shortId}",
                $"""
                Merhaba {order.Customer.FirstName},

                #{shortId} numaralı siparişiniz iptal edildi.
                İptal Nedeni: {reason}

                Ödemeniz yapıldıysa, iade işlemi 3-5 iş günü içinde hesabınıza yansıyacaktır.

                Sorularınız için destek hattımıza başvurabilirsiniz.
                """
            );

            // Merchant'a bildirim
            var merchantEmail = order
                .Items.Select(i => i.Product?.Merchant?.User?.Email)
                .FirstOrDefault(e => !string.IsNullOrEmpty(e));

            if (!string.IsNullOrEmpty(merchantEmail))
            {
                await _notificationService.SendEmailAsync(
                    merchantEmail,
                    $"Sipariş İptal Edildi — #{shortId}",
                    $"""
                    #{shortId} numaralı sipariş iptal edildi.
                    İptal Nedeni: {reason}

                    Stok miktarlarınız otomatik olarak güncellendi.
                    """
                );
            }

            _logger.LogInformation(
                "[NotificationJob] İptal bildirimi gönderildi: Order={OrderId}",
                order.Id
            );
        }
    }
}
