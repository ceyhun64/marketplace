namespace api.Common.DTOs;

// ── Checkout request/response ─────────────────────────────────────────────────

public class PaymentCheckoutRequestDto
{
    public Guid OrderId { get; set; }
    public string? CallbackUrl { get; set; }
}

public class PaymentCheckoutResponseDto
{
    /// <summary>Stripe Payment Intent client secret — frontend Elements için</summary>
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>Stripe Payment Intent ID</summary>
    public string PaymentIntentId { get; set; } = string.Empty;

    /// <summary>Publishable key — frontend Stripe.js için</summary>
    public string PublishableKey { get; set; } = string.Empty;

    /// <summary>Sipariş tutarı</summary>
    public decimal Amount { get; set; }

    /// <summary>Para birimi (default: try)</summary>
    public string Currency { get; set; } = "try";
}

// ── Ödeme onayı (frontend'den backend'e) ─────────────────────────────────────

public class ConfirmPaymentDto
{
    public Guid OrderId { get; set; }
    public string PaymentIntentId { get; set; } = string.Empty;
}

// ── Stripe webhook ────────────────────────────────────────────────────────────

public class StripeWebhookDto
{
    public string? Type { get; set; }
    public string? PaymentIntentId { get; set; }
    public string? ConversationId { get; set; }
    public decimal? Amount { get; set; }
}

// ── Geri uyumluluk: eski iyzico tip isimleri (controller imzalarında kullanılıyor) ─
public class IyzicoCallbackDto
{
    public string? Token { get; set; }
    public string? Status { get; set; }
    public string? ConversationId { get; set; }
}

public class IyzicoWebhookDto
{
    public string? PaymentId { get; set; }
    public string? Status { get; set; }
    public string? ConversationId { get; set; }
    public decimal? Price { get; set; }
}

// ── İade ─────────────────────────────────────────────────────────────────────

public class RefundRequestDto
{
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
}

// ── Ödeme durumu ──────────────────────────────────────────────────────────────

public class PaymentStatusDto
{
    public string PaymentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
}
