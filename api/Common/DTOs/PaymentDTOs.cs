namespace api.Common.DTOs;

public class PaymentCheckoutRequestDto
{
    public Guid OrderId { get; set; }
    public string? CallbackUrl { get; set; }
}

public class PaymentCheckoutResponseDto
{
    public string CheckoutFormContent { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}

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

public class RefundRequestDto
{
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
}

public class PaymentStatusDto
{
    public string PaymentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
}
