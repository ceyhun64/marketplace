namespace api.Infrastructure.Services;
using api.Common.DTOs;

public interface IPaymentService
{
    Task<ServiceResult<PaymentCheckoutResponseDto>> InitiateCheckoutAsync(
        PaymentCheckoutRequestDto request
    );
    Task<ServiceResult<Guid>> HandleCallbackAsync(IyzicoCallbackDto callback);
    Task HandleWebhookAsync(IyzicoWebhookDto webhook);
    Task<ServiceResult<bool>> RefundAsync(Guid orderId, RefundRequestDto request);
    Task<PaymentStatusDto?> GetPaymentStatusAsync(Guid orderId);
}
