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
                "WEBHOOK_URLS is not defined — event={Event} skipped. "
                    + "To receive webhooks, set the WEBHOOK_URLS environment variable "
                    + "to a comma-separated list of URLs.",
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
                        "Webhook sent: event={Event} url={Url}",
                        eventType,
                        url
                    );
                else
                    _logger.LogWarning(
                        "Webhook failed: event={Event} url={Url} status={Status}",
                        eventType,
                        url,
                        (int)response.StatusCode
                    );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Webhook could not be sent: event={Event} url={Url}",
                    eventType,
                    url
                );
            }
        }
    }

    /// <summary>
    /// Stripe webhook signature verification.
    /// Validates the signature in the Stripe-Signature header against the raw body and webhook secret.
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
