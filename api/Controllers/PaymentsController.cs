using api.Common.DTOs;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    // POST /api/payments/checkout — Customer
    [HttpPost("checkout")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> InitiateCheckout([FromBody] PaymentCheckoutRequestDto request)
    {
        var result = await _paymentService.InitiateCheckoutAsync(request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<PaymentCheckoutResponseDto>(result.Data));
    }

    // POST /api/payments/callback — iyzico 3DS callback (System)
    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> PaymentCallback([FromForm] IyzicoCallbackDto callback)
    {
        try
        {
            var result = await _paymentService.HandleCallbackAsync(callback);
            if (!result.Success)
            {
                _logger.LogWarning("iyzico callback başarısız: {Message}", result.Message);
                return Redirect($"/checkout?error={Uri.EscapeDataString(result.Message)}");
            }
            return Redirect($"/orders/{result.Data}/tracking");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "iyzico callback işlenirken hata oluştu.");
            return Redirect("/checkout?error=payment_error");
        }
    }

    // POST /api/payments/webhook — iyzico webhook bildirimi (System)
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook([FromBody] IyzicoWebhookDto webhook)
    {
        try
        {
            await _paymentService.HandleWebhookAsync(webhook);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook işlenirken hata oluştu.");
            return StatusCode(500);
        }
    }

    // POST /api/payments/{id}/refund — Admin
    [HttpPost("{id}/refund")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> RefundPayment(Guid id, [FromBody] RefundRequestDto request)
    {
        var result = await _paymentService.RefundAsync(id, request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<string>("İade işlemi başlatıldı."));
    }

    // GET /api/payments/{id}/status — Customer
    [HttpGet("{id}/status")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> GetPaymentStatus(Guid id)
    {
        var status = await _paymentService.GetPaymentStatusAsync(id);
        if (status == null)
            return NotFound(new ApiResponse<string>("Ödeme bulunamadı."));
        return Ok(new ApiResponse<PaymentStatusDto>(status));
    }
}
