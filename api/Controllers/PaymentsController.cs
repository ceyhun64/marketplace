using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public PaymentsController(
        IPaymentService paymentService,
        ILogger<PaymentsController> logger,
        AppDbContext db,
        ICurrentUserService currentUser)
    {
        _paymentService = paymentService;
        _logger = logger;
        _db = db;
        _currentUser = currentUser;
    }

    // ── POST /api/payments/checkout — Customer ────────────────────────────────
    /// <summary>
    /// Creates a Stripe Payment Intent and returns the client_secret.
    /// The frontend uses this secret to complete payment via Stripe.js.
    /// </summary>
    [HttpPost("checkout")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> InitiateCheckout([FromBody] PaymentCheckoutRequestDto request)
    {
        var result = await _paymentService.InitiateCheckoutAsync(request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<PaymentCheckoutResponseDto>(result.Data!));
    }

    // ── POST /api/payments/confirm — Customer ─────────────────────────────────
    /// <summary>
    /// Called after the frontend completes payment via Stripe.js.
    /// Verifies PaymentIntent status and confirms the order.
    /// </summary>
    [HttpPost("confirm")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentDto dto)
    {
        var result = await _paymentService.ConfirmPaymentAsync(dto);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(
            new ApiResponse<object>(new { orderId = result.Data, message = "Payment confirmed." })
        );
    }

    // ── POST /api/payments/webhook — Stripe webhook (System) ─────────────────
    /// <summary>
    /// Processes webhook events sent by Stripe.
    /// payment_intent.succeeded → automatically confirms the order.
    /// Stripe signature is read from the header and verified.
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
        var rawBody = await new StreamReader(Request.Body).ReadToEndAsync();
        var stripeSignature = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrEmpty(stripeSignature))
        {
            _logger.LogWarning("Missing Stripe-Signature header.");
            return BadRequest("Missing Stripe-Signature header.");
        }

        try
        {
            await _paymentService.HandleWebhookAsync(rawBody, stripeSignature);
            return Ok();
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook signature verification failed.");
            return BadRequest("Invalid webhook signature.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing Stripe webhook.");
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
        return Ok(new ApiResponse<string>("Refund initiated."));
    }

    // ── GET /api/payments/{id}/status — Customer/Admin ────────────────────────
    [HttpGet("{id}/status")]
    [Authorize]
    public async Task<IActionResult> GetPaymentStatus(Guid id)
    {
        // Ownership check: Customers can only query their own orders.
        // Merchants can query orders that contain their items.
        // Admins bypass the check entirely.
        var role = _currentUser.Role;
        if (role == "Customer")
        {
            var belongs = await _db.Orders.AnyAsync(
                o => o.Id == id && o.CustomerId == _currentUser.UserId);
            if (!belongs)
                return NotFound(new ApiResponse<string>("Payment not found."));
        }
        else if (role == "Merchant")
        {
            var merchantId = _currentUser.MerchantId;
            if (merchantId == null)
                return Forbid();

            var belongs = await _db.Orders.AnyAsync(
                o => o.Id == id && o.Items.Any(i => i.MerchantId == merchantId.Value));
            if (!belongs)
                return NotFound(new ApiResponse<string>("Payment not found."));
        }

        var status = await _paymentService.GetPaymentStatusAsync(id);
        if (status == null)
            return NotFound(new ApiResponse<string>("Payment not found."));
        return Ok(new ApiResponse<PaymentStatusDto>(status));
    }
}
