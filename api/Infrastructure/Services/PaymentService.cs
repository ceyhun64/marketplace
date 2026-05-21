using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Jobs;
using api.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Stripe;

namespace api.Infrastructure.Services;

/// <summary>
/// Stripe Payment Intent flow:
///   1. InitiateCheckoutAsync  → Create PaymentIntent, return client_secret
///   2. Frontend               → Enter card via Stripe.js / Elements, confirmCardPayment()
///   3. ConfirmPaymentAsync    → Verify PaymentIntent status, confirm order
///   4. HandleWebhookAsync     → Asynchronous confirmation via Stripe webhook (reliable fallback)
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;
    private readonly IInvoiceGeneratorService _invoiceGenerator;
    private readonly INotificationService _notification;
    private readonly ICurrentUserService _currentUser;
    private readonly IDistributedCache _cache;

    public PaymentService(
        AppDbContext db,
        IConfiguration config,
        ILogger<PaymentService> logger,
        IInvoiceGeneratorService invoiceGenerator,
        INotificationService notification,
        ICurrentUserService currentUser,
        IDistributedCache cache
    )
    {
        _db = db;
        _config = config;
        _logger = logger;
        _invoiceGenerator = invoiceGenerator;
        _notification = notification;
        _currentUser = currentUser;
        _cache = cache;
    }

    // ── 1. Create Payment Intent ──────────────────────────────────────────────

    public async Task<ServiceResult<PaymentCheckoutResponseDto>> InitiateCheckoutAsync(
        PaymentCheckoutRequestDto request
    )
    {
        try
        {
            var order = await _db
                .Orders.Include(o => o.Customer)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order is null)
                return ServiceResult<PaymentCheckoutResponseDto>.Fail("Order not found.");

            if (order.IsPaid)
                return ServiceResult<PaymentCheckoutResponseDto>.Fail(
                    "This order has already been paid."
                );

            // Load VendorOrders to resolve per-merchant Stripe accounts and platform fees
            var vendorOrders = await _db
                .VendorOrders.Include(vo => vo.Merchant)
                .Where(vo => vo.OrderId == order.Id)
                .ToListAsync();

            var amountInCents = (long)(order.TotalAmount * 100);

            // ── Stripe Connect: attach transfer and fee data ──────────────────
            // For single-merchant orders we use transfer_data to route funds directly.
            // For multi-merchant carts, the platform collects the full amount and
            // splits via separate transfers on payment confirmation (see FinalizeOrderPaymentAsync).
            var singleVendor = vendorOrders.Count == 1 ? vendorOrders[0] : null;
            var stripeAccountId = singleVendor?.Merchant?.StripeAccountId;
            var onboardingComplete = singleVendor?.Merchant?.StripeOnboardingComplete ?? false;

            var totalPlatformFee = vendorOrders.Sum(vo => vo.PlatformFee);
            var platformFeeInCents = (long)(totalPlatformFee * 100);

            var options = new PaymentIntentCreateOptions
            {
                Amount = amountInCents,
                Currency = _config["STRIPE_CURRENCY"] ?? "try",
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
                Metadata = new Dictionary<string, string>
                {
                    ["orderId"] = order.Id.ToString(),
                    ["customerId"] = order.CustomerId.ToString(),
                    ["vendorCount"] = vendorOrders.Count.ToString(),
                },
                Description = $"Marketplace Order #{order.Id.ToString()[..8].ToUpper()}",
                ReceiptEmail = order.Customer?.Email,
                // Attach application fee so Stripe retains platform commission
                ApplicationFeeAmount = platformFeeInCents > 0 ? platformFeeInCents : null,
                // For single-vendor orders with a connected account, route directly
                TransferData =
                    (
                        singleVendor != null
                        && onboardingComplete
                        && !string.IsNullOrEmpty(stripeAccountId)
                    )
                        ? new PaymentIntentTransferDataOptions { Destination = stripeAccountId }
                        : null,
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            order.PaymentToken = intent.Id;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "✅ Stripe PaymentIntent created: OrderId={OrderId} IntentId={IntentId} Amount={Amount} PlatformFee={Fee}",
                order.Id,
                intent.Id,
                order.TotalAmount,
                totalPlatformFee
            );

            return ServiceResult<PaymentCheckoutResponseDto>.Ok(
                new PaymentCheckoutResponseDto
                {
                    ClientSecret = intent.ClientSecret,
                    PaymentIntentId = intent.Id,
                    PublishableKey = _config["STRIPE_PUBLISHABLE_KEY"] ?? string.Empty,
                    Amount = order.TotalAmount,
                    Currency = _config["STRIPE_CURRENCY"] ?? "try",
                }
            );
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe PaymentIntent creation error: {Message}", ex.Message);
            return ServiceResult<PaymentCheckoutResponseDto>.Fail(
                $"Payment could not be initiated: {ex.Message}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ InitiateCheckout unexpected error");
            return ServiceResult<PaymentCheckoutResponseDto>.Fail("An unexpected error occurred.");
        }
    }

    // ── 2. Payment confirmation (after frontend confirmCardPayment) ───────────

    public async Task<ServiceResult<Guid>> ConfirmPaymentAsync(ConfirmPaymentDto dto)
    {
        try
        {
            var service = new PaymentIntentService();
            var intent = await service.GetAsync(dto.PaymentIntentId);

            if (intent.Status != "succeeded")
            {
                _logger.LogWarning(
                    "⚠️ PaymentIntent not yet completed: {Status} IntentId={Id}",
                    intent.Status,
                    dto.PaymentIntentId
                );
                return ServiceResult<Guid>.Fail(
                    $"Payment status: {intent.Status}. Please try again."
                );
            }

            // Get orderId from Stripe-signed metadata — do not trust client input (IDOR prevention)
            if (
                !intent.Metadata.TryGetValue("orderId", out var orderIdStr)
                || !Guid.TryParse(orderIdStr, out var orderId)
            )
            {
                _logger.LogError(
                    "❌ PaymentIntent metadata has no valid orderId: IntentId={Id}",
                    dto.PaymentIntentId
                );
                return ServiceResult<Guid>.Fail("Payment reference could not be verified.");
            }

            // Identity check: does this PaymentIntent really belong to this customer?
            if (
                intent.Metadata.TryGetValue("customerId", out var customerIdStr)
                && Guid.TryParse(customerIdStr, out var intentCustomerId)
                && intentCustomerId != _currentUser.UserId
            )
            {
                _logger.LogWarning(
                    "⚠️ IDOR attempt: IntentId={IntentId} CustomerId={Claimed} vs {Actual}",
                    dto.PaymentIntentId,
                    _currentUser.UserId,
                    intentCustomerId
                );
                return ServiceResult<Guid>.Fail("This payment does not belong to you.");
            }

            return await FinalizeOrderPaymentAsync(orderId, dto.PaymentIntentId);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe confirmation error: {Message}", ex.Message);
            return ServiceResult<Guid>.Fail($"Payment could not be verified: {ex.Message}");
        }
    }

    // ── 3. Stripe Webhook (reliable async path) ───────────────────────────────

    public async Task HandleWebhookAsync(string rawBody, string stripeSignature)
    {
        var webhookSecret = _config["STRIPE_WEBHOOK_SECRET"];
        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("⚠️ STRIPE_WEBHOOK_SECRET not configured — webhook not processed.");
            return;
        }

        Stripe.Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(rawBody, stripeSignature, webhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe webhook signature verification error");
            throw;
        }

        // ── Webhook Event Idempotency ─────────────────────────────────────────
        // Stripe retries webhooks when it receives a non-2xx response (e.g. DB
        // was temporarily unavailable).  We deduplicate by caching the Stripe
        // event ID in Redis for 48 hours — the retry window Stripe uses.
        // If the key already exists the event has been processed successfully;
        // we return immediately to avoid duplicate order confirmations, invoice
        // generation, or notification emails.
        var idempotencyKey = $"stripe_event:{stripeEvent.Id}";
        var alreadyProcessed = await _cache.GetStringAsync(idempotencyKey);
        if (alreadyProcessed is not null)
        {
            _logger.LogInformation(
                "⚡ Stripe webhook deduplicated (already processed): EventId={EventId} Type={Type}",
                stripeEvent.Id,
                stripeEvent.Type);
            return;
        }

        _logger.LogInformation("📨 Stripe webhook received: {EventType} EventId={EventId}",
            stripeEvent.Type, stripeEvent.Id);

        switch (stripeEvent.Type)
        {
            case "payment_intent.succeeded":
                if (stripeEvent.Data.Object is PaymentIntent successIntent)
                    await HandlePaymentSucceededAsync(successIntent);
                break;

            case "payment_intent.payment_failed":
                if (stripeEvent.Data.Object is PaymentIntent failedIntent)
                    await HandlePaymentFailedAsync(failedIntent);
                break;

            case "charge.refunded":
                _logger.LogInformation("💸 Refund confirmed by Stripe: EventId={EventId}", stripeEvent.Id);
                break;

            default:
                _logger.LogDebug("Unknown Stripe event: {Type} EventId={EventId}", stripeEvent.Type, stripeEvent.Id);
                break;
        }

        // Mark this event as processed — 48-hour TTL matches Stripe's retry window.
        // We only reach this line on success; if the handler throws, the key is NOT
        // set and Stripe will retry (which is the correct behaviour).
        await _cache.SetStringAsync(
            idempotencyKey,
            "1",
            new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(48),
            });
    }

    // ── 4. Refund ─────────────────────────────────────────────────────────────

    public async Task<ServiceResult<bool>> RefundAsync(Guid orderId, RefundRequestDto request)
    {
        try
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order is null)
                return ServiceResult<bool>.Fail("Order not found.");

            if (!order.IsPaid || string.IsNullOrEmpty(order.PaymentId))
                return ServiceResult<bool>.Fail("Cannot refund this order (payment not found).");

            // Refund via PaymentIntent
            var chargeService = new ChargeService();
            var charges = await chargeService.ListAsync(
                new ChargeListOptions { PaymentIntent = order.PaymentId, Limit = 1 }
            );

            var charge = charges.Data.FirstOrDefault();
            if (charge is null)
                return ServiceResult<bool>.Fail("No payment record found for refund.");

            var refundOptions = new RefundCreateOptions
            {
                Charge = charge.Id,
                Amount = request.Amount > 0 ? (long)(request.Amount * 100) : null, // null = full refund
                Reason = MapRefundReason(request.Reason),
            };

            var refundService = new RefundService();
            var refund = await refundService.CreateAsync(refundOptions);

            _logger.LogInformation(
                "✅ Refund initiated: OrderId={OrderId} RefundId={RefundId} Amount={Amount}",
                orderId,
                refund.Id,
                request.Amount
            );

            // Update order status
            order.Status = OrderStatus.Cancelled;
            order.CancellationReason = request.Reason ?? "Refund requested.";
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return ServiceResult<bool>.Ok(true);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe refund error: {Message}", ex.Message);
            return ServiceResult<bool>.Fail($"Refund could not be initiated: {ex.Message}");
        }
    }

    // ── 5. Query payment status ───────────────────────────────────────────────

    public async Task<PaymentStatusDto?> GetPaymentStatusAsync(Guid orderId)
    {
        var order = await _db.Orders.FindAsync(orderId);
        if (order is null || string.IsNullOrEmpty(order.PaymentId))
            return null;

        try
        {
            var service = new PaymentIntentService();
            var intent = await service.GetAsync(order.PaymentId);

            return new PaymentStatusDto
            {
                PaymentId = intent.Id,
                Status = intent.Status,
                Amount = intent.Amount / 100m,
                CreatedAt = intent.Created,
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ PaymentIntent query error: {Message}", ex.Message);
            return null;
        }
    }

    // ── 6. Subscription payment ───────────────────────────────────────────────

    public async Task<ServiceResult<string>> ProcessSubscriptionPaymentAsync(
        string paymentMethodId,
        decimal amount,
        string description
    )
    {
        try
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100),
                Currency = _config["STRIPE_CURRENCY"] ?? "try",
                PaymentMethod = paymentMethodId,
                Confirm = true,
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never",
                },
                Description = description,
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            _logger.LogInformation(
                "✅ Subscription payment: Amount={Amount} IntentId={Id}",
                amount,
                intent.Id
            );

            return ServiceResult<string>.Ok(intent.Id);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Subscription payment error: {Message}", ex.Message);
            return ServiceResult<string>.Fail($"Subscription payment failed: {ex.Message}");
        }
    }

    // ── Backward compatibility (legacy iyzico signatures) ────────────────────

    public Task<ServiceResult<Guid>> HandleCallbackAsync(IyzicoCallbackDto callback)
    {
        _logger.LogWarning("HandleCallbackAsync: iyzico callback is now using Stripe.");
        return Task.FromResult(
            ServiceResult<Guid>.Fail(
                "This endpoint is no longer in use. Use /api/payments/confirm."
            )
        );
    }

    public Task HandleWebhookAsync(IyzicoWebhookDto webhook)
    {
        _logger.LogWarning("IyzicoWebhookDto: now using Stripe webhook.");
        return Task.CompletedTask;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task HandlePaymentSucceededAsync(PaymentIntent intent)
    {
        if (
            !intent.Metadata.TryGetValue("orderId", out var orderIdStr)
            || !Guid.TryParse(orderIdStr, out var orderId)
        )
        {
            _logger.LogWarning("PaymentIntent metadata has no orderId: {Id}", intent.Id);
            return;
        }

        await FinalizeOrderPaymentAsync(orderId, intent.Id);
    }

    private async Task HandlePaymentFailedAsync(PaymentIntent intent)
    {
        if (
            !intent.Metadata.TryGetValue("orderId", out var orderIdStr)
            || !Guid.TryParse(orderIdStr, out var orderId)
        )
            return;

        var order = await _db.Orders.FindAsync(orderId);
        if (order is null)
            return;

        order.Status = OrderStatus.Failed;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogWarning(
            "❌ Payment failed: OrderId={OrderId} IntentId={IntentId}",
            orderId,
            intent.Id
        );

        await _notification.SendOrderStatusNotificationAsync(
            orderId,
            $"Payment for your order failed. Please try again. Order #{orderId.ToString()[..8].ToUpper()}"
        );
    }

    /// <summary>
    /// On successful payment:
    ///   - Mark order as "Paid"
    ///   - Generate invoice
    ///   - Send invoice email
    ///   - Create shipment
    /// </summary>
    private async Task<ServiceResult<Guid>> FinalizeOrderPaymentAsync(
        Guid orderId,
        string paymentIntentId
    )
    {
        string trackingNumber;

        // RepeatableRead transaction — IsPaid read and write are atomic, prevents TOCTOU race
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead
        );
        try
        {
            var order = await _db
                .Orders.Include(o => o.Items)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order is null)
            {
                await tx.RollbackAsync();
                return ServiceResult<Guid>.Fail("Order not found.");
            }

            if (order.IsPaid)
            {
                _logger.LogInformation("Order already paid: {OrderId}", orderId);
                await tx.RollbackAsync();
                return ServiceResult<Guid>.Ok(orderId);
            }

            // Save payment details
            order.IsPaid = true;
            order.PaidAt = DateTime.UtcNow;
            order.PaymentId = paymentIntentId;
            order.Status = OrderStatus.PaymentConfirmed;
            order.UpdatedAt = DateTime.UtcNow;

            // Create shipment — only if not already created (CreateShipmentForOrderAsync may have already done it)
            var shipment = await _db.Shipments.FirstOrDefaultAsync(s => s.OrderId == orderId);
            if (shipment == null)
            {
                shipment = new api.Domain.Entities.Shipment
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    TrackingNumber = GenerateTrackingNumber(),
                    Status = api.Domain.Enums.ShipmentStatus.Pending,
                    EstimatedDelivery = DateTime.UtcNow.AddDays(
                        order.ShippingRate == api.Domain.Enums.ShippingRate.Express ? 1 : 3
                    ),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _db.Shipments.Add(shipment);
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            trackingNumber = shipment.TrackingNumber;

            _logger.LogInformation(
                "✅ Order paid: OrderId={OrderId} IntentId={IntentId} TrackingNo={Tracking}",
                orderId,
                paymentIntentId,
                trackingNumber
            );
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        // ── Post-payment side effects — Outbox / Hangfire pattern ────────────
        //
        // Why NOT inline here:
        //   If invoice generation or notification fails AFTER the payment commit,
        //   the order is in a paid-but-no-invoice state with no retry path.
        //   On the next Stripe webhook retry, FinalizeOrderPaymentAsync returns
        //   early (order.IsPaid == true) so these side effects would never run.
        //
        // Solution: enqueue each side effect as a separate Hangfire job.
        //   - Hangfire persists jobs in PostgreSQL — they survive pod restarts.
        //   - Each job retries independently up to 10 times with exponential backoff.
        //   - Invoice generation and notification are idempotent (they check if an
        //     invoice already exists before creating a new one).
        //
        // This is a lightweight Outbox Pattern: the "outbox" is Hangfire's job store.
        //
        // BackgroundJob.Enqueue uses Hangfire's static API which resolves the
        // job processor from the global DI container registered in Program.cs.
        // This is safe to call from a scoped service.
        try
        {
            BackgroundJob.Enqueue<PostPaymentSideEffectsJob>(
                j => j.RunAsync(orderId, trackingNumber));
        }
        catch (Exception ex)
        {
            // If Hangfire itself fails (e.g. DB connection lost), fall back to a
            // best-effort inline attempt so the customer at least gets a notification.
            _logger.LogError(ex, "⚠️ Failed to enqueue post-payment job for OrderId={Id} — attempting inline fallback", orderId);

            _ = Task.Run(async () =>
            {
                try
                {
                    var orderForInvoice = await _db.Orders
                        .Include(o => o.Items)
                        .Include(o => o.Customer)
                        .FirstOrDefaultAsync(o => o.Id == orderId);

                    if (orderForInvoice != null)
                    {
                        var invoice = await _invoiceGenerator.GenerateAndSaveAsync(orderForInvoice);
                        if (!string.IsNullOrEmpty(invoice.PdfUrl))
                            await _notification.SendInvoiceEmailAsync(orderId, invoice.PdfUrl);
                    }

                    await _notification.SendOrderStatusNotificationAsync(
                        orderId,
                        $"Your order #{orderId.ToString()[..8].ToUpper()} has been confirmed! Tracking: {trackingNumber}");
                }
                catch (Exception fallbackEx)
                {
                    _logger.LogError(fallbackEx, "⚠️ Inline fallback also failed for OrderId={Id}", orderId);
                }
            });
        }

        return ServiceResult<Guid>.Ok(orderId);
    }

    private static string GenerateTrackingNumber()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()[^6..];
        var random = Random.Shared.Next(1000, 9999);
        return $"MKT{timestamp}{random}";
    }

    private static string? MapRefundReason(string? reason) =>
        reason?.ToLower() switch
        {
            "duplicate" => "duplicate",
            "fraudulent" => "fraudulent",
            _ => "requested_by_customer",
        };
}
