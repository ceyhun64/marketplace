using api.Domain.Enums;

namespace api.Infrastructure.Services;

/// <summary>
/// Tüm bildirim kanallarını kapsayan servis arayüzü.
/// Milestone 2: Twilio SMS + SendGrid e-posta entegrasyonu burada tanımlanır.
/// </summary>
public interface INotificationService
{
    // ── Temel e-posta ───────────────────────────────────────────────────────
    Task SendEmailAsync(string to, string subject, string body);

    // ── SMS (Twilio) ─────────────────────────────────────────────────────────
    Task SendSmsAsync(string toPhoneNumber, string message);

    // ── Sipariş & Kargo güncellemeleri ──────────────────────────────────────

    /// <summary>
    /// Her kargo durum değişikliğinde e-posta + SMS gönderir.
    /// FulfillmentService.TransitionStatusAsync() tarafından çağrılır.
    /// </summary>
    Task SendShipmentStatusNotificationAsync(
        Guid shipmentId,
        ShipmentStatus newStatus,
        string? note = null
    );

    /// <summary>Kurye atandığında müşteriye ve kuryeye bildirim.</summary>
    Task SendCourierAssignedNotificationAsync(api.Domain.Entities.Shipment shipment);

    /// <summary>Genel sipariş durum değişikliği bildirimi.</summary>
    Task SendOrderStatusNotificationAsync(Guid orderId, string message);

    /// <summary>Push/FCM tarzı in-app bildirim (SignalR fallback).</summary>
    Task SendOrderUpdateNotificationAsync(string userId, string message);

    // ── Kargo etiketi & fatura ───────────────────────────────────────────────

    /// <summary>Fatura oluşturulduğunda müşteriye PDF bağlantısını gönderir.</summary>
    Task SendInvoiceEmailAsync(Guid orderId, string invoicePdfUrl);

    /// <summary>Kargo etiketi hazır olduğunda kuryeye SMS gönderir.</summary>
    Task SendLabelReadySmsAsync(Guid shipmentId);
}
