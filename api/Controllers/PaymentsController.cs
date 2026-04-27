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

    // ── POST /api/payments/checkout — Customer ────────────────────────────────
    /// <summary>
    /// Stripe Payment Intent oluşturur ve client_secret döndürür.
    /// Frontend bu secret ile Stripe.js üzerinden ödemeyi tamamlar.
    /// </summary>
    [HttpPost("checkout")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> InitiateCheckout([FromBody] PaymentCheckoutRequestDto request)
    {
        var result = await _paymentService.InitiateCheckoutAsync(request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<PaymentCheckoutResponseDto>(result.Data));
    }

    // ── POST /api/payments/confirm — Customer ─────────────────────────────────
    /// <summary>
    /// Frontend Stripe.js ile ödemeyi tamamladıktan sonra bu endpoint çağrılır.
    /// PaymentIntent durumu doğrulanır ve sipariş onaylanır.
    /// </summary>
    [HttpPost("confirm")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentDto dto)
    {
        var result = await _paymentService.ConfirmPaymentAsync(dto);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(
            new ApiResponse<object>(new { orderId = result.Data, message = "Ödeme onaylandı." })
        );
    }

    // ── POST /api/payments/webhook — Stripe webhook (System) ─────────────────
    /// <summary>
    /// Stripe'ın gönderdiği webhook event'lerini işler.
    /// payment_intent.succeeded → siparişi otomatik onayla.
    /// Stripe imzası header'dan okunarak doğrulanır.
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
        var rawBody = await new StreamReader(Request.Body).ReadToEndAsync();
        var stripeSignature = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrEmpty(stripeSignature))
        {
            _logger.LogWarning("Stripe-Signature header eksik.");
            return BadRequest("Missing Stripe-Signature header.");
        }

        try
        {
            await _paymentService.HandleWebhookAsync(rawBody, stripeSignature);
            return Ok();
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook imza doğrulama başarısız.");
            return BadRequest("Invalid webhook signature.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe webhook işlenirken beklenmeyen hata.");
            return StatusCode(500);
        }
    }

    // ── POST /api/payments/{id}/refund — Admin ────────────────────────────────
    [HttpPost("{id}/refund")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> RefundPayment(Guid id, [FromBody] RefundRequestDto request)
    {
        var result = await _paymentService.RefundAsync(id, request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<string>("İade işlemi başlatıldı."));
    }

    // ── GET /api/payments/{id}/status — Customer/Admin ────────────────────────
    [HttpGet("{id}/status")]
    [Authorize]
    public async Task<IActionResult> GetPaymentStatus(Guid id)
    {
        var status = await _paymentService.GetPaymentStatusAsync(id);
        if (status == null)
            return NotFound(new ApiResponse<string>("Ödeme bulunamadı."));
        return Ok(new ApiResponse<PaymentStatusDto>(status));
    }
}
