namespace api.Infrastructure.Services;

using api.Common.DTOs;

public interface IPaymentService
{
    /// <summary>
    /// Stripe Payment Intent oluşturur ve client secret döner.
    /// Frontend bu secret ile Stripe Elements üzerinden ödemeyi tamamlar.
    /// </summary>
    Task<ServiceResult<PaymentCheckoutResponseDto>> InitiateCheckoutAsync(
        PaymentCheckoutRequestDto request
    );

    /// <summary>
    /// Frontend ödemeyi tamamladıktan sonra Payment Intent durumunu doğrular
    /// ve siparişi onaylar.
    /// </summary>
    Task<ServiceResult<Guid>> ConfirmPaymentAsync(ConfirmPaymentDto dto);

    /// <summary>Stripe webhook event'lerini işler (payment_intent.succeeded, vb.)</summary>
    Task HandleWebhookAsync(string rawBody, string stripeSignature);

    /// <summary>Stripe üzerinden iade başlatır.</summary>
    Task<ServiceResult<bool>> RefundAsync(Guid orderId, RefundRequestDto request);

    /// <summary>Sipariş ID'sine göre ödeme durumunu döner.</summary>
    Task<PaymentStatusDto?> GetPaymentStatusAsync(Guid orderId);

    /// <summary>Abonelik ödemesi (Stripe PaymentIntent).</summary>
    Task<ServiceResult<string>> ProcessSubscriptionPaymentAsync(
        string paymentMethodId,
        decimal amount,
        string description
    );

    // Geri uyumluluk: eski iyzico imzaları (artık Stripe'a yönlendiriyor)
    Task<ServiceResult<Guid>> HandleCallbackAsync(IyzicoCallbackDto callback);
    Task HandleWebhookAsync(IyzicoWebhookDto webhook);
}
