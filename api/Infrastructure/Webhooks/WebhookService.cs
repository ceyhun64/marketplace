using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace api.Infrastructure.Webhooks;

public class WebhookService : IWebhookService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebhookService> _logger;
    private readonly IConfiguration _config;

    public WebhookService(
        IHttpClientFactory httpClientFactory,
        ILogger<WebhookService> logger,
        IConfiguration config
    )
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _config = config;
    }

    public async Task DispatchAsync(string eventType, object payload)
    {
        // Ortam değişkeninden webhook URL'lerini al (virgülle ayrılmış liste)
        var webhookUrls = _config["WEBHOOK_URLS"]?.Split(',') ?? [];
        if (webhookUrls.Length == 0)
        {
            _logger.LogDebug("Kayıtlı webhook URL yok — event={Event}", eventType);
            return;
        }

        var json = JsonSerializer.Serialize(new
        {
            @event = eventType,
            timestamp = DateTime.UtcNow,
            data = payload,
        });

        var client = _httpClientFactory.CreateClient("webhook");

        foreach (var url in webhookUrls.Select(u => u.Trim()).Where(u => !string.IsNullOrEmpty(u)))
        {
            try
            {
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await client.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                    _logger.LogInformation(
                        "Webhook gönderildi: event={Event} url={Url}",
                        eventType,
                        url
                    );
                else
                    _logger.LogWarning(
                        "Webhook başarısız: event={Event} url={Url} status={Status}",
                        eventType,
                        url,
                        (int)response.StatusCode
                    );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook gönderilemedi: event={Event} url={Url}", eventType, url);
            }
        }
    }

    /// <summary>
    /// iyzico HMAC-SHA256 imza doğrulaması.
    /// İmza = HMAC-SHA256(secretKey, rawBody) hex string.
    /// </summary>
    public bool VerifyIyzicoSignature(string rawBody, string signature, string secretKey)
    {
        try
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var bodyBytes = Encoding.UTF8.GetBytes(rawBody);

            using var hmac = new HMACSHA256(keyBytes);
            var computed = hmac.ComputeHash(bodyBytes);
            var computedHex = Convert.ToHexString(computed).ToLowerInvariant();

            return computedHex.Equals(signature.ToLowerInvariant(), StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }
}
