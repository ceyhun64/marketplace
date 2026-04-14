namespace api.Infrastructure.Services;

public interface IPaymentService
{
    Task<string> InitializeCheckoutAsync(Guid orderId);
    Task<bool> HandleWebhookAsync(string payload, string signature);
    Task<bool> RefundAsync(Guid orderId, decimal amount);
}
