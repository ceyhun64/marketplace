namespace api.Infrastructure.Webhooks;

/// <summary>
/// Platform içi ve dışı (Stripe, iyzico vb.) webhook gönderme servisi.
/// Ödeme onayı, sipariş durumu değişikliği ve fulfillment olayları için kullanılır.
/// </summary>
public interface IWebhookService
{
    /// <summary>
    /// Belirli bir event için kayıtlı tüm webhook endpoint'lerine HTTP POST atar.
    /// Başarısız olursa Hangfire üzerinden retry kuyruğuna alınır.
    /// </summary>
    Task DispatchAsync(string eventType, object payload);

    /// <summary>
    /// Stripe'tan gelen webhook imzasını doğrular.
    /// </summary>
    bool VerifyStripeSignature(string rawBody, string signature, string webhookSecret);
}
