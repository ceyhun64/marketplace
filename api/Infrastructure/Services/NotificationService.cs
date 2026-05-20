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
/// Milestone 2 — Full NotificationService implementation.
/// Real SendGrid (email) and Twilio (SMS) integration.
/// All keys are read from appsettings.json / environment variables.
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

    // ── User-id-based convenience wrapper ───────────────────────────────────

    public async Task SendAsync(Guid userId, string subject, string body)
    {
        var email = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(email))
        {
            _logger.LogWarning("SendAsync: no email found for UserId={UserId}", userId);
            return;
        }

        await SendEmailAsync(email, subject, body);
    }

    // ── Email (SendGrid) ────────────────────────────────────────────────────

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var apiKey = _config["SENDGRID_API_KEY"];
        var fromEmail = _config["SENDGRID_FROM_EMAIL"] ?? "noreply@marketplace.com";
        var fromName = _config["SENDGRID_FROM_NAME"] ?? "Marketplace";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("⚠️  SENDGRID_API_KEY not configured — email skipped: {To}", to);
            return;
        }

        try
        {
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, fromName);
            var recipient = new EmailAddress(to);

            // HTML body: wrap plain text in a simple HTML template
            var htmlBody = $"""
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <h2 style="color:#0d0d0d;border-bottom:2px solid #c84b2f;padding-bottom:8px">
                    Marketplace Notification
                  </h2>
                  <p style="font-size:15px;line-height:1.7;color:#333">{body}</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="font-size:12px;color:#999">This email was sent automatically.</p>
                </div>
                """;

            var msg = MailHelper.CreateSingleEmail(from, recipient, subject, body, htmlBody);
            var response = await client.SendEmailAsync(msg);

            if ((int)response.StatusCode >= 400)
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                _logger.LogError(
                    "❌ SendGrid error: {Status} — {Body}",
                    (int)response.StatusCode,
                    responseBody
                );
            }
            else
            {
                _logger.LogInformation("📧 Email sent: {To} | {Subject}", to, subject);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ SendGrid exception: {To} | {Subject}", to, subject);
        }
    }

    // ── SMS (Twilio) ─────────────────────────────────────────────────────────

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
                "⚠️  Twilio configuration missing — SMS skipped: {Phone}",
                toPhoneNumber
            );
            return;
        }

        // Normalize phone number: must start with +90
        var normalizedPhone = NormalizePhone(toPhoneNumber);
        if (string.IsNullOrEmpty(normalizedPhone))
        {
            _logger.LogWarning("⚠️  Invalid phone number: {Phone}", toPhoneNumber);
            return;
        }

        try
        {
            var smsMessage = await MessageResource.CreateAsync(
                body: message,
                from: new PhoneNumber(fromNumber),
                to: new PhoneNumber(normalizedPhone)
            );

            _logger.LogInformation(
                "📱 SMS sent: {Phone} | SID={Sid} | Status={Status}",
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

    // ── Shipment status change notification ──────────────────────────────────

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

            // Email
            await SendEmailAsync(customer.Email, emailSubject!, emailBody);

            // SMS (optional)
            if (!string.IsNullOrEmpty(customer.Phone))
                await SendSmsAsync(customer.Phone, smsText!);

            _logger.LogInformation(
                "✅ Shipment notification sent: ShipmentId={Id} Status={Status}",
                shipmentId,
                newStatus
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send shipment notification: ShipmentId={Id}", shipmentId);
        }
    }

    // ── Courier assigned notification ────────────────────────────────────────

    public async Task SendCourierAssignedNotificationAsync(api.Domain.Entities.Shipment shipment)
    {
        _logger.LogInformation("🚚 Courier assigned notification: ShipmentId={Id}", shipment.Id);

        // Customer shipment status notification
        await SendShipmentStatusNotificationAsync(shipment.Id, ShipmentStatus.CourierAssigned);

        // Label ready SMS to courier
        await SendLabelReadySmsAsync(shipment.Id);
    }

    // ── General order status notification ────────────────────────────────────

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
                $"Order Update — #{orderId.ToString()[..8].ToUpper()}",
                message
            );

            if (!string.IsNullOrEmpty(order.Customer.Phone))
                await SendSmsAsync(order.Customer.Phone, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send order notification: OrderId={Id}", orderId);
        }
    }

    public Task SendOrderUpdateNotificationAsync(string userId, string message)
    {
        // Real-time push via SignalR — FulfillmentService calls TrackingHub directly.
        // Logging only here; no email/SMS to avoid duplication.
        _logger.LogInformation("🔔 Push notification: UserId={User} Message={Message}", userId, message);
        return Task.CompletedTask;
    }

    // ── Invoice email ─────────────────────────────────────────────────────────

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
            var subject = $"Your Invoice is Ready — Order #{shortId}";
            var body = $"""
                Hi {order.Customer.FirstName},

                Your invoice for order #{shortId} is ready.

                Download your invoice here:
                {invoicePdfUrl}

                Order Summary:
                - Total: {order.TotalAmount:C2}
                - Shipping: {order.ShippingRate}

                Thank you for shopping with us!
                """;

            await SendEmailAsync(order.Customer.Email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send invoice email: OrderId={Id}", orderId);
        }
    }

    // ── Shipping label SMS (to courier) ──────────────────────────────────────

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
                    "⚠️  Courier has no phone number: CourierId={Id}",
                    shipment.Courier.Id
                );
                return;
            }

            var message =
                $"Hi {courierName}, you have a new shipment assignment. "
                + $"Tracking: {shipment.TrackingNumber}. "
                + "View the label in your courier panel.";

            await SendSmsAsync(courierPhone, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "❌ Failed to send courier SMS: ShipmentId={Id}",
                shipmentId
            );
        }
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    /// <summary>
    /// Returns the email subject, email body, and SMS text for each status.
    /// Returns null to skip the notification.
    /// </summary>
    private static (string? Subject, string? Body, string? Sms) BuildStatusMessages(
        api.Domain.Entities.Shipment shipment,
        ShipmentStatus status,
        string? note
    )
    {
        var trackingNo = shipment.TrackingNumber;
        var recipientName = shipment.Order?.RecipientName ?? "Customer";
        var shortOrderId = shipment.OrderId.ToString()[..8].ToUpper();
        var eta = shipment.EstimatedDelivery.ToLocalTime().ToString("dd.MM.yyyy");
        var noteText = string.IsNullOrEmpty(note) ? "" : $"\nNote: {note}";

        return status switch
        {
            ShipmentStatus.LabelGenerated => (
                Subject: $"Shipping Label Generated — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    Your order ({shortOrderId}) has been packed and a shipping label has been created.
                    Tracking Number: {trackingNo}
                    Estimated Delivery: {eta}{noteText}

                    Track your shipment at: /track/{trackingNo}
                    """,
                Sms: $"Your order is packed! Tracking: {trackingNo} — ETA: {eta}"
            ),
            ShipmentStatus.CourierAssigned => (
                Subject: $"Courier Assigned — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    A courier has been assigned to your order ({shortOrderId}).
                    The courier will pick up your package shortly.
                    Tracking Number: {trackingNo}
                    Estimated Delivery: {eta}{noteText}
                    """,
                Sms: $"Your courier is assigned! Tracking: {trackingNo} — ETA: {eta}"
            ),
            ShipmentStatus.PickedUp => (
                Subject: $"Package Picked Up — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    Great news! Your order ({shortOrderId}) has been picked up by the courier.
                    Tracking Number: {trackingNo}
                    Estimated Delivery: {eta}{noteText}

                    Track in real time: /track/{trackingNo}
                    """,
                Sms: $"Your package is on its way! Tracking: {trackingNo} — ETA: {eta}"
            ),
            ShipmentStatus.InTransit => (
                Subject: $"Your Package is In Transit — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    Your order ({shortOrderId}) is currently in transit.
                    Tracking Number: {trackingNo}
                    Estimated Delivery: {eta}{noteText}

                    Live tracking: /track/{trackingNo}
                    """,
                Sms: $"Your package is in transit! Tracking: {trackingNo}"
            ),
            ShipmentStatus.OutForDelivery => (
                Subject: $"Your Package is Out for Delivery Today! — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    Great news! Your order ({shortOrderId}) will be delivered today.
                    The courier is on their way.
                    Tracking Number: {trackingNo}{noteText}

                    Track delivery: /track/{trackingNo}
                    """,
                Sms: $"Your package will be delivered today! Courier is on the way. Tracking: {trackingNo}"
            ),
            ShipmentStatus.Delivered => (
                Subject: $"Delivered — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    Your order ({shortOrderId}) has been successfully delivered. 🎉
                    Thank you for shopping with us!{noteText}

                    Sign in to your account to view your order history.
                    """,
                Sms: $"Your order has been delivered! 🎉 #{shortOrderId}"
            ),
            ShipmentStatus.Failed => (
                Subject: $"Delivery Failed — #{shortOrderId}",
                Body: $"""
                    Hi {recipientName},

                    Unfortunately, delivery for your order ({shortOrderId}) could not be completed.
                    Tracking Number: {trackingNo}{noteText}

                    Please contact our support team.
                    Track status: /track/{trackingNo}
                    """,
                Sms: $"Delivery failed. Details: /track/{trackingNo} — Please contact support."
            ),
            _ => (null, null, null),
        };
    }

    /// <summary>
    /// Normalizes a phone number to E.164 format (+905XXXXXXXXX).
    /// Returns null for invalid numbers.
    /// </summary>
    private static string? NormalizePhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        // Keep only digits and + character
        var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());

        // Already in E.164 format
        if (digits.StartsWith('+') && digits.Length >= 10)
            return digits;

        // Turkish numbers: 05XXXXXXXXX → +905XXXXXXXXX
        if (digits.StartsWith("05") && digits.Length == 11)
            return $"+9{digits}";

        // International without plus: 905XXXXXXXXX → +905XXXXXXXXX
        if (digits.StartsWith("90") && digits.Length == 12)
            return $"+{digits}";

        // 10-digit: 5XXXXXXXXX → +905XXXXXXXXX
        if (digits.Length == 10 && digits.StartsWith('5'))
            return $"+90{digits}";

        return null;
    }
}
