using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

/// <summary>
/// Milestone 2 NotificationService implementasyonu.
/// SendGrid (e-posta) ve Twilio (SMS) entegrasyonu TODO placeholder olarak bırakılmıştır.
/// Gerçek anahtarlar appsettings / env'den yüklenir.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationService> _logger;
    private readonly IConfiguration _config;

    public NotificationService(
        AppDbContext db,
        ILogger<NotificationService> logger,
        IConfiguration config
    )
    {
        _db = db;
        _logger = logger;
        _config = config;
    }

    // ── E-posta (SendGrid) ──────────────────────────────────────────────────

    public Task SendEmailAsync(string to, string subject, string body)
    {
        // TODO: SendGrid entegrasyonu
        // var client = new SendGridClient(_config["SENDGRID_API_KEY"]);
        // var msg = MailHelper.CreateSingleEmail(
        //     from: new EmailAddress(_config["SENDGRID_FROM_EMAIL"], "Marketplace"),
        //     to:   new EmailAddress(to),
        //     subject: subject,
        //     plainTextContent: body,
        //     htmlContent: body
        // );
        // await client.SendEmailAsync(msg);

        _logger.LogInformation("📧 E-posta: to={To} | subject={Subject}", to, subject);
        return Task.CompletedTask;
    }

    // ── SMS (Twilio) ────────────────────────────────────────────────────────

    public Task SendSmsAsync(string toPhoneNumber, string message)
    {
        // TODO: Twilio entegrasyonu
        // TwilioClient.Init(_config["TWILIO_ACCOUNT_SID"], _config["TWILIO_AUTH_TOKEN"]);
        // await MessageResource.CreateAsync(
        //     body: message,
        //     from: new PhoneNumber(_config["TWILIO_FROM_NUMBER"]),
        //     to:   new PhoneNumber(toPhoneNumber)
        // );

        _logger.LogInformation("📱 SMS: to={Phone} | msg={Message}", toPhoneNumber, message);
        return Task.CompletedTask;
    }

    // ── Kargo durum değişikliği ─────────────────────────────────────────────

    public async Task SendShipmentStatusNotificationAsync(
        Guid shipmentId,
        ShipmentStatus newStatus,
        string? note = null
    )
    {
        try
        {
            var shipment = await _db
                .Shipments.Include(s => s.Order)
                    .ThenInclude(o => o.Customer)
                .FirstOrDefaultAsync(s => s.Id == shipmentId);

            if (shipment?.Order?.Customer == null)
                return;

            var customer = shipment.Order.Customer;

            var message = newStatus switch
            {
                ShipmentStatus.CourierAssigned =>
                    $"Siparişiniz kurye tarafından alınmak üzere hazırlanıyor. Takip: {shipment.TrackingNumber}",
                ShipmentStatus.PickedUp =>
                    $"Siparişiniz kargoya verildi. Takip: {shipment.TrackingNumber}",
                ShipmentStatus.InTransit =>
                    $"Siparişiniz yolda! Takip: {shipment.TrackingNumber}",
                ShipmentStatus.OutForDelivery =>
                    $"Siparişiniz bugün teslim edilecek. Takip: {shipment.TrackingNumber}",
                ShipmentStatus.Delivered =>
                    "Siparişiniz teslim edildi. İyi alışverişler! 🎉",
                ShipmentStatus.Failed =>
                    "Teslimat gerçekleştirilemedi. Lütfen destek hattımızla iletişime geçin.",
                _ => null,
            };

            if (message == null)
                return;

            await SendEmailAsync(
                customer.Email,
                $"Kargo Güncelleme — Takip: {shipment.TrackingNumber}",
                message
            );

            if (!string.IsNullOrEmpty(customer.PhoneNumber))
                await SendSmsAsync(customer.PhoneNumber, message);

            _logger.LogInformation(
                "✅ Kargo bildirimi gönderildi: ShipmentId={Id} Status={Status}",
                shipmentId,
                newStatus
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Kargo bildirimi gönderilemedi: ShipmentId={Id}", shipmentId);
        }
    }

    // ── Kurye atandı ────────────────────────────────────────────────────────

    public async Task SendCourierAssignedNotificationAsync(api.Domain.Entities.Shipment shipment)
    {
        _logger.LogInformation("🚚 Kurye atandı bildirimi: ShipmentId={Id}", shipment.Id);
        await SendShipmentStatusNotificationAsync(shipment.Id, ShipmentStatus.CourierAssigned);
        await SendLabelReadySmsAsync(shipment.Id);
    }

    // ── Genel sipariş bildirimi ─────────────────────────────────────────────

    public Task SendOrderStatusNotificationAsync(Guid orderId, string message)
    {
        _logger.LogInformation(
            "📦 Sipariş bildirimi: OrderId={Id} Mesaj={Message}",
            orderId,
            message
        );
        return Task.CompletedTask;
    }

    public Task SendOrderUpdateNotificationAsync(string userId, string message)
    {
        _logger.LogInformation(
            "🔔 Push bildirimi: UserId={User} Mesaj={Message}",
            userId,
            message
        );
        return Task.CompletedTask;
    }

    // ── Fatura bildirimi ────────────────────────────────────────────────────

    public async Task SendInvoiceEmailAsync(Guid orderId, string invoicePdfUrl)
    {
        try
        {
            var order = await _db
                .Orders.Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order?.Customer == null)
                return;

            await SendEmailAsync(
                order.Customer.Email,
                $"Faturanız Hazır — Sipariş #{orderId}",
                $"Siparişinize ait fatura hazırlandı. PDF için: {invoicePdfUrl}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fatura e-postası gönderilemedi: OrderId={Id}", orderId);
        }
    }

    // ── Kargo etiketi bildirimi ─────────────────────────────────────────────

    public async Task SendLabelReadySmsAsync(Guid shipmentId)
    {
        try
        {
            var shipment = await _db
                .Shipments.Include(s => s.Courier)
                    .ThenInclude(c => c!.User)
                .FirstOrDefaultAsync(s => s.Id == shipmentId);

            if (shipment?.Courier?.User?.PhoneNumber == null)
                return;

            await SendSmsAsync(
                shipment.Courier.User.PhoneNumber,
                $"Kargo etiketiniz hazır. Takip No: {shipment.TrackingNumber}. "
                    + "Etiketi portalde görüntüleyebilirsiniz."
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Kurye SMS gönderilemedi: ShipmentId={Id}", shipmentId);
        }
    }
}
