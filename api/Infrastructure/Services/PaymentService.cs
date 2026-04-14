namespace api.Infrastructure.Services;

/// <summary>
/// iyzico payment integration — full implementation in Milestone 3.
/// Stub keeps the project compiling while other milestones are built.
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(ILogger<PaymentService> logger)
    {
        _logger = logger;
    }

    public Task<string> InitializeCheckoutAsync(Guid orderId)
    {
        // TODO (Milestone 3): Call iyzico API, return checkout token/form URL.
        _logger.LogInformation("InitializeCheckout called for order {OrderId}", orderId);
        return Task.FromResult(string.Empty);
    }

    public Task<bool> HandleWebhookAsync(string payload, string signature)
    {
        // TODO (Milestone 3): Verify iyzico signature, update order status.
        _logger.LogInformation("Payment webhook received");
        return Task.FromResult(true);
    }

    public Task<bool> RefundAsync(Guid orderId, decimal amount)
    {
        // TODO (Milestone 3): Call iyzico refund API.
        _logger.LogInformation(
            "Refund requested for order {OrderId}, amount {Amount}",
            orderId,
            amount
        );
        return Task.FromResult(true);
    }
}
