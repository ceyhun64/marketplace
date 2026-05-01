using System.Text;
using System.Text.Json;
using Stripe;

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
        var webhookUrls = _config["WEBHOOK_URLS"]?.Split(',') ?? [];
        if (webhookUrls.Length == 0)
        {
            _logger.LogInformation(
                "WEBHOOK_URLS tanımlı değil — event={Event} atlandı. "
                    + "Webhook almak için ortam değişkenlerinde WEBHOOK_URLS değerini "
                    + "virgülle ayrılmış URL listesi olarak tanımlayın.",
                eventType
            );
            return;
        }

        var json = JsonSerializer.Serialize(
            new
            {
                @event = eventType,
                timestamp = DateTime.UtcNow,
                data = payload,
            }
        );

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
                _logger.LogError(
                    ex,
                    "Webhook gönderilemedi: event={Event} url={Url}",
                    eventType,
                    url
                );
            }
        }
    }

    /// <summary>
    /// Stripe webhook imza doğrulaması.
    /// Stripe-Signature header'ındaki imzayı, raw body ve webhook secret ile doğrular.
    /// </summary>
    public bool VerifyStripeSignature(string rawBody, string signature, string webhookSecret)
    {
        try
        {
            EventUtility.ConstructEvent(rawBody, signature, webhookSecret);
            return true;
        }
        catch (StripeException)
        {
            return false;
        }
    }
}
