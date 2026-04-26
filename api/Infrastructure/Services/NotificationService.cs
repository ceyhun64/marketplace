using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SendGrid;
using SendGrid.Helpers.Mail;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace api.Infrastructure.Services;

/// <summary>
/// Milestone 2 — Tam NotificationService implementasyonu.
/// SendGrid (e-posta) ve Twilio (SMS) gerçek entegrasyonu.
/// Tüm anahtarlar appsettings.json / ortam değişkenlerinden okunur.
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

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var apiKey = _config["SENDGRID_API_KEY"];
        var fromEmail = _config["SENDGRID_FROM_EMAIL"] ?? "noreply@marketplace.com";
        var fromName = _config["SENDGRID_FROM_NAME"] ?? "Marketplace";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("⚠️  SENDGRID_API_KEY tanımlı değil — e-posta atlandı: {To}", to);
            return;
        }

        try
        {
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, fromName);
            var recipient = new EmailAddress(to);

            // HTML body: düz metni basit bir HTML şablona sar
            var htmlBody = $"""
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <h2 style="color:#0d0d0d;border-bottom:2px solid #c84b2f;padding-bottom:8px">
                    Marketplace Bildirimi
                  </h2>
                  <p style="font-size:15px;line-height:1.7;color:#333">{body}</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="font-size:12px;color:#999">Bu e-posta otomatik olarak gönderilmiştir.</p>
                </div>
                """;

            var msg = MailHelper.CreateSingleEmail(from, recipient, subject, body, htmlBody);
            var response = await client.SendEmailAsync(msg);

            if ((int)response.StatusCode >= 400)
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                _logger.LogError(
                    "❌ SendGrid hata: {Status} — {Body}",
                    (int)response.StatusCode,
                    responseBody
                );
            }
            else
            {
                _logger.LogInformation("📧 E-posta gönderildi: {To} | {Subject}", to, subject);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ SendGrid exception: {To} | {Subject}", to, subject);
        }
    }

    // ── SMS (Twilio) ────────────────────────────────────────────────────────

    public async Task SendSmsAsync(string toPhoneNumber, string message)
    {
        var accountSid = _config["TWILIO_ACCOUNT_SID"];
        var authToken = _config["TWILIO_AUTH_TOKEN"];
        var fromNumber = _config["TWILIO_FROM_NUMBER"];

        if (
            string.IsNullOrWhiteSpace(accountSid)
            || string.IsNullOrWhiteSpace(authToken)
            || string.IsNullOrWhiteSpace(fromNumber)
        )
        {
            _logger.LogWarning(
                "⚠️  Twilio yapılandırması eksik — SMS atlandı: {Phone}",
                toPhoneNumber
            );
            return;
        }

        // Telefon numarasını normalize et: +90 ile başlamalı
        var normalizedPhone = NormalizePhone(toPhoneNumber);
        if (string.IsNullOrEmpty(normalizedPhone))
        {
            _logger.LogWarning("⚠️  Geçersiz telefon numarası: {Phone}", toPhoneNumber);
            return;
        }

        try
        {
            TwilioClient.Init(accountSid, authToken);

            var smsMessage = await MessageResource.CreateAsync(
                body: message,
                from: new PhoneNumber(fromNumber),
                to: new PhoneNumber(normalizedPhone)
            );

            _logger.LogInformation(
                "📱 SMS gönderildi: {Phone} | SID={Sid} | Status={Status}",
                normalizedPhone,
                smsMessage.Sid,
                smsMessage.Status
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Twilio exception: {Phone}", normalizedPhone);
        }
    }

    // ── Kargo durum değişikliği bildirimi ───────────────────────────────────

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
                .Include(s => s.Courier)
                    .ThenInclude(c => c!.User)
                .FirstOrDefaultAsync(s => s.Id == shipmentId);

            if (shipment?.Order?.Customer == null)
                return;

            var customer = shipment.Order.Customer;

            var (emailSubject, emailBody, smsText) = BuildStatusMessages(shipment, newStatus, note);

            if (emailBody == null)
                return;

            // E-posta
            await SendEmailAsync(customer.Email, emailSubject!, emailBody);

            // SMS (opsiyonel)
            if (!string.IsNullOrEmpty(customer.Phone))
                await SendSmsAsync(customer.Phone, smsText!);

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

    // ── Kurye atandı bildirimi ──────────────────────────────────────────────

    public async Task SendCourierAssignedNotificationAsync(api.Domain.Entities.Shipment shipment)
    {
        _logger.LogInformation("🚚 Kurye atandı bildirimi: ShipmentId={Id}", shipment.Id);

        // Müşteriye kargo durumu bildirimi
        await SendShipmentStatusNotificationAsync(shipment.Id, ShipmentStatus.CourierAssigned);

        // Kuryeye etiket hazır SMS
        await SendLabelReadySmsAsync(shipment.Id);
    }

    // ── Genel sipariş durum bildirimi ───────────────────────────────────────

    public async Task SendOrderStatusNotificationAsync(Guid orderId, string message)
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
                $"Sipariş Güncelleme — #{orderId.ToString()[..8].ToUpper()}",
                message
            );

            if (!string.IsNullOrEmpty(order.Customer.Phone))
                await SendSmsAsync(order.Customer.Phone, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Sipariş bildirimi gönderilemedi: OrderId={Id}", orderId);
        }
    }

    public Task SendOrderUpdateNotificationAsync(string userId, string message)
    {
        // SignalR üzerinden anlık push — FulfillmentService TrackingHub'ı doğrudan çağırıyor.
        // Burada sadece loglama yeterli; duplikasyon önlemek için e-posta/SMS yok.
        _logger.LogInformation("🔔 Push bildirimi: UserId={User} Mesaj={Message}", userId, message);
        return Task.CompletedTask;
    }

    // ── Fatura e-postası ────────────────────────────────────────────────────

    public async Task SendInvoiceEmailAsync(Guid orderId, string invoicePdfUrl)
    {
        try
        {
            var order = await _db
                .Orders.Include(o => o.Customer)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order?.Customer == null)
                return;

            var shortId = orderId.ToString()[..8].ToUpper();
            var subject = $"Faturanız Hazır — Sipariş #{shortId}";
            var body = $"""
                Merhaba {order.Customer.FirstName},

                #{shortId} numaralı siparişinize ait fatura hazırlandı.

                Faturanızı aşağıdaki bağlantıdan indirebilirsiniz:
                {invoicePdfUrl}

                Sipariş Özeti:
                - Toplam Tutar: {order.TotalAmount:C2}
                - Kargo: {order.ShippingRate}

                İyi alışverişler!
                """;

            await SendEmailAsync(order.Customer.Email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fatura e-postası gönderilemedi: OrderId={Id}", orderId);
        }
    }

    // ── Kargo etiketi SMS (kuryeye) ─────────────────────────────────────────

    public async Task SendLabelReadySmsAsync(Guid shipmentId)
    {
        try
        {
            var shipment = await _db
                .Shipments.Include(s => s.Courier)
                    .ThenInclude(c => c!.User)
                .FirstOrDefaultAsync(s => s.Id == shipmentId);

            if (shipment?.Courier?.User == null)
                return;

            var courierPhone = shipment.Courier.User.Phone;
            var courierName = shipment.Courier.User.FirstName;

            if (string.IsNullOrEmpty(courierPhone))
            {
                _logger.LogWarning(
                    "⚠️  Kurye telefonu yok: CourierId={Id}",
                    shipment.Courier.Id
                );
                return;
            }

            var message =
                $"Merhaba {courierName}, yeni kargo atamanız hazır. "
                + $"Takip No: {shipment.TrackingNumber}. "
                + "Etiketi kurye panelinizden görüntüleyebilirsiniz.";

            await SendSmsAsync(courierPhone, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "❌ Kurye SMS gönderilemedi: ShipmentId={Id}",
                shipmentId
            );
        }
    }

    // ── Yardımcı metodlar ───────────────────────────────────────────────────

    /// <summary>
    /// Her durum için e-posta konusu, e-posta gövdesi ve SMS metnini döner.
    /// null dönerse bildirim gönderilmez.
    /// </summary>
    private static (string? Subject, string? Body, string? Sms) BuildStatusMessages(
        api.Domain.Entities.Shipment shipment,
        ShipmentStatus status,
        string? note
    )
    {
        var trackingNo = shipment.TrackingNumber;
        var recipientName = shipment.Order?.RecipientName ?? "Müşteri";
        var shortOrderId = shipment.OrderId.ToString()[..8].ToUpper();
        var eta = shipment.EstimatedDelivery.ToLocalTime().ToString("dd.MM.yyyy");
        var noteText = string.IsNullOrEmpty(note) ? "" : $"\nNot: {note}";

        return status switch
        {
            ShipmentStatus.LabelGenerated => (
                Subject: $"Kargo Etiketi Oluşturuldu — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Siparişiniz ({shortOrderId}) paketlendi ve kargo etiketi oluşturuldu.
                    Takip Numaranız: {trackingNo}
                    Tahmini Teslim: {eta}{noteText}

                    Kargo durumunuzu takip etmek için: /track/{trackingNo}
                    """,
                Sms: $"Siparişiniz paketlendi! Takip: {trackingNo} — ETA: {eta}"
            ),
            ShipmentStatus.CourierAssigned => (
                Subject: $"Kurye Atandı — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Siparişiniz ({shortOrderId}) için kurye atandı.
                    Kurye yakında paketi teslim alacak.
                    Takip Numaranız: {trackingNo}
                    Tahmini Teslim: {eta}{noteText}
                    """,
                Sms: $"Kuryeniz atandı! Takip: {trackingNo} — ETA: {eta}"
            ),
            ShipmentStatus.PickedUp => (
                Subject: $"Kargonuz Alındı — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Harika haber! Siparişiniz ({shortOrderId}) kurye tarafından teslim alındı.
                    Takip Numaranız: {trackingNo}
                    Tahmini Teslim: {eta}{noteText}

                    Anlık takip için: /track/{trackingNo}
                    """,
                Sms: $"Kargonuz yola çıktı! Takip: {trackingNo} — ETA: {eta}"
            ),
            ShipmentStatus.InTransit => (
                Subject: $"Kargonuz Yolda — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Siparişiniz ({shortOrderId}) taşıma sürecinde.
                    Takip Numaranız: {trackingNo}
                    Tahmini Teslim: {eta}{noteText}

                    Canlı takip: /track/{trackingNo}
                    """,
                Sms: $"Kargonuz yolda! Takip: {trackingNo}"
            ),
            ShipmentStatus.OutForDelivery => (
                Subject: $"Kargonuz Bugün Geliyor! — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Harika haber! Siparişiniz ({shortOrderId}) bugün teslim edilecek.
                    Kurye yakında kapınızda olacak.
                    Takip Numaranız: {trackingNo}{noteText}

                    Durumu takip edin: /track/{trackingNo}
                    """,
                Sms: $"Kargonuz bugün teslim edilecek! Kurye yolda. Takip: {trackingNo}"
            ),
            ShipmentStatus.Delivered => (
                Subject: $"Teslim Edildi — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Siparişiniz ({shortOrderId}) başarıyla teslim edildi. 🎉
                    İyi alışverişler!{noteText}

                    Sipariş geçmişiniz için hesabınıza giriş yapabilirsiniz.
                    """,
                Sms: $"Siparişiniz teslim edildi! 🎉 #{shortOrderId}"
            ),
            ShipmentStatus.Failed => (
                Subject: $"Teslimat Başarısız — #{shortOrderId}",
                Body: $"""
                    Merhaba {recipientName},

                    Siparişiniz ({shortOrderId}) için teslimat gerçekleştirilemedi.
                    Takip Numaranız: {trackingNo}{noteText}

                    Lütfen destek hattımızla iletişime geçin.
                    Durumu takip edin: /track/{trackingNo}
                    """,
                Sms: $"Teslimat başarısız oldu. Detay: /track/{trackingNo} — Destek için bize ulaşın."
            ),
            _ => (null, null, null),
        };
    }

    /// <summary>
    /// Telefon numarasını E.164 formatına çevirir (+905XXXXXXXXX).
    /// Geçersiz ise null döner.
    /// </summary>
    private static string? NormalizePhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        // Sadece rakam ve + karakterini bırak
        var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());

        // Zaten E.164 formatında ise doğrudan kullan
        if (digits.StartsWith('+') && digits.Length >= 10)
            return digits;

        // Türk numaraları: 05XXXXXXXXX → +905XXXXXXXXX
        if (digits.StartsWith("05") && digits.Length == 11)
            return $"+9{digits}";

        // Uluslararası formatsız: 905XXXXXXXXX → +905XXXXXXXXX
        if (digits.StartsWith("90") && digits.Length == 12)
            return $"+{digits}";

        // 10 haneli: 5XXXXXXXXX → +905XXXXXXXXX
        if (digits.Length == 10 && digits.StartsWith('5'))
            return $"+90{digits}";

        return null;
    }
}
