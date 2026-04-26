namespace api.Infrastructure.Webhooks;

/// <summary>
/// Platform içi ve dışı (iyzico, özel entegrasyonlar) webhook gönderme servisi.
/// Ödeme onayı, sipariş durumu değişikliği, fulfillment olayları için kullanılır.
/// </summary>
public interface IWebhookService
{
    /// <summary>
    /// Belirli bir event için kayıtlı tüm webhook endpoint'lerine HTTP POST atar.
    /// Başarısız olursa Hangfire üzerinden retry kuyruğuna alınır.
    /// </summary>
    Task DispatchAsync(string eventType, object payload);

    /// <summary>iyzico'dan gelen webhook imzasını doğrular.</summary>
    bool VerifyIyzicoSignature(string rawBody, string signature, string secretKey);
}
