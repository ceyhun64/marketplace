using api.Common.DTOs;
using api.Infrastructure.Services;
using Microsoft.Extensions.Logging;

namespace api.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(ILogger<PaymentService> logger) => _logger = logger;

    public Task<ServiceResult<PaymentCheckoutResponseDto>> InitiateCheckoutAsync(
        PaymentCheckoutRequestDto request
    )
    {
        _logger.LogInformation("InitiateCheckout: OrderId={Id}", request.OrderId);
        return Task.FromResult(
            ServiceResult<PaymentCheckoutResponseDto>.Fail("TODO: iyzico entegrasyonu")
        );
    }

    public Task<ServiceResult<Guid>> HandleCallbackAsync(IyzicoCallbackDto callback)
    {
        _logger.LogInformation("HandleCallback çağrıldı");
        return Task.FromResult(ServiceResult<Guid>.Fail("TODO"));
    }

    public Task HandleWebhookAsync(IyzicoWebhookDto webhook)
    {
        _logger.LogInformation("Webhook alındı");
        return Task.CompletedTask;
    }

    public Task<ServiceResult<bool>> RefundAsync(Guid orderId, RefundRequestDto request)
    {
        _logger.LogInformation("Refund: OrderId={Id}", orderId);
        return Task.FromResult(ServiceResult<bool>.Ok(true));
    }

    public Task<PaymentStatusDto?> GetPaymentStatusAsync(Guid orderId)
    {
        _logger.LogInformation("GetPaymentStatus: OrderId={Id}", orderId);
        return Task.FromResult<PaymentStatusDto?>(null);
    }
}
