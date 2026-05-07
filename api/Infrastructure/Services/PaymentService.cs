using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace api.Infrastructure.Services;

/// <summary>
/// Stripe Payment Intent akışı:
///   1. InitiateCheckoutAsync  → PaymentIntent oluştur, client_secret döndür
///   2. Frontend               → Stripe.js / Elements ile kartı gir, confirmCardPayment()
///   3. ConfirmPaymentAsync    → PaymentIntent durumunu doğrula, siparişi onayla
///   4. HandleWebhookAsync     → Stripe webhook ile asenkron onay (güvenilir yedek yol)
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;
    private readonly IInvoiceGeneratorService _invoiceGenerator;
    private readonly INotificationService _notification;

    public PaymentService(
        AppDbContext db,
        IConfiguration config,
        ILogger<PaymentService> logger,
        IInvoiceGeneratorService invoiceGenerator,
        INotificationService notification
    )
    {
        _db = db;
        _config = config;
        _logger = logger;
        _invoiceGenerator = invoiceGenerator;
        _notification = notification;

        StripeConfiguration.ApiKey =
            config["STRIPE_SECRET_KEY"]
            ?? throw new InvalidOperationException(
                "STRIPE_SECRET_KEY ortam değişkeni tanımlı değil."
            );
    }

    // ── 1. Payment Intent oluştur ─────────────────────────────────────────────

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
                return ServiceResult<PaymentCheckoutResponseDto>.Fail("Sipariş bulunamadı.");

            if (order.IsPaid)
                return ServiceResult<PaymentCheckoutResponseDto>.Fail("Bu sipariş zaten ödenmiş.");

            // Tutar kuruş cinsinden (Stripe için)
            var amountInCents = (long)(order.TotalAmount * 100);

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
                },
                Description = $"Marketplace Siparişi #{order.Id.ToString()[..8].ToUpper()}",
                ReceiptEmail = order.Customer?.Email,
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            // PaymentIntent ID'sini siparişe kaydet
            order.PaymentToken = intent.Id;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "✅ Stripe PaymentIntent oluşturuldu: OrderId={OrderId} IntentId={IntentId} Amount={Amount}",
                order.Id,
                intent.Id,
                order.TotalAmount
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
            _logger.LogError(ex, "❌ Stripe PaymentIntent oluşturma hatası: {Message}", ex.Message);
            return ServiceResult<PaymentCheckoutResponseDto>.Fail(
                $"Ödeme başlatılamadı: {ex.Message}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ InitiateCheckout beklenmeyen hata");
            return ServiceResult<PaymentCheckoutResponseDto>.Fail("Beklenmeyen bir hata oluştu.");
        }
    }

    // ── 2. Ödeme onayı (frontend confirmCardPayment sonrası) ──────────────────

    public async Task<ServiceResult<Guid>> ConfirmPaymentAsync(ConfirmPaymentDto dto)
    {
        try
        {
            var service = new PaymentIntentService();
            var intent = await service.GetAsync(dto.PaymentIntentId);

            if (intent.Status != "succeeded")
            {
                _logger.LogWarning(
                    "⚠️ PaymentIntent henüz tamamlanmadı: {Status} IntentId={Id}",
                    intent.Status,
                    dto.PaymentIntentId
                );
                return ServiceResult<Guid>.Fail(
                    $"Ödeme durumu: {intent.Status}. Lütfen tekrar deneyin."
                );
            }

            return await FinalizeOrderPaymentAsync(dto.OrderId, dto.PaymentIntentId);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe onay hatası: {Message}", ex.Message);
            return ServiceResult<Guid>.Fail($"Ödeme doğrulanamadı: {ex.Message}");
        }
    }

    // ── 3. Stripe Webhook (güvenilir asenkron yol) ────────────────────────────

    public async Task HandleWebhookAsync(string rawBody, string stripeSignature)
    {
        var webhookSecret = _config["STRIPE_WEBHOOK_SECRET"];
        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("⚠️ STRIPE_WEBHOOK_SECRET tanımlı değil — webhook işlenmedi.");
            return;
        }

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(rawBody, stripeSignature, webhookSecret);

            _logger.LogInformation("📨 Stripe webhook alındı: {EventType}", stripeEvent.Type);

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
                    _logger.LogInformation("💸 İade işlemi Stripe tarafından onaylandı.");
                    break;

                default:
                    _logger.LogDebug("Bilinmeyen Stripe event: {Type}", stripeEvent.Type);
                    break;
            }
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe webhook imza doğrulama hatası");
            throw;
        }
    }

    // ── 4. İade ──────────────────────────────────────────────────────────────

    public async Task<ServiceResult<bool>> RefundAsync(Guid orderId, RefundRequestDto request)
    {
        try
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order is null)
                return ServiceResult<bool>.Fail("Sipariş bulunamadı.");

            if (!order.IsPaid || string.IsNullOrEmpty(order.PaymentId))
                return ServiceResult<bool>.Fail(
                    "Bu sipariş için iade yapılamaz (ödeme bulunamadı)."
                );

            // PaymentIntent üzerinden iade
            var chargeService = new ChargeService();
            var charges = await chargeService.ListAsync(
                new ChargeListOptions { PaymentIntent = order.PaymentId, Limit = 1 }
            );

            var charge = charges.Data.FirstOrDefault();
            if (charge is null)
                return ServiceResult<bool>.Fail("İade için ödeme kaydı bulunamadı.");

            var refundOptions = new RefundCreateOptions
            {
                Charge = charge.Id,
                Amount = request.Amount > 0 ? (long)(request.Amount * 100) : null, // null = tam iade
                Reason = MapRefundReason(request.Reason),
            };

            var refundService = new RefundService();
            var refund = await refundService.CreateAsync(refundOptions);

            _logger.LogInformation(
                "✅ İade başlatıldı: OrderId={OrderId} RefundId={RefundId} Amount={Amount}",
                orderId,
                refund.Id,
                request.Amount
            );

            // Sipariş durumunu güncelle
            order.Status = OrderStatus.Cancelled;
            order.CancellationReason = request.Reason ?? "İade talep edildi.";
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return ServiceResult<bool>.Ok(true);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe iade hatası: {Message}", ex.Message);
            return ServiceResult<bool>.Fail($"İade başlatılamadı: {ex.Message}");
        }
    }

    // ── 5. Ödeme durumu sorgula ───────────────────────────────────────────────

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
            _logger.LogError(ex, "❌ PaymentIntent sorgulama hatası: {Message}", ex.Message);
            return null;
        }
    }

    // ── 6. Abonelik ödemesi ───────────────────────────────────────────────────

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
                "✅ Abonelik ödemesi: Amount={Amount} IntentId={Id}",
                amount,
                intent.Id
            );

            return ServiceResult<string>.Ok(intent.Id);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Abonelik ödeme hatası: {Message}", ex.Message);
            return ServiceResult<string>.Fail($"Abonelik ödemesi başarısız: {ex.Message}");
        }
    }

    // ── Geri uyumluluk (eski iyzico imzaları) ────────────────────────────────

    public Task<ServiceResult<Guid>> HandleCallbackAsync(IyzicoCallbackDto callback)
    {
        _logger.LogWarning("HandleCallbackAsync: iyzico callback'i artık Stripe kullanıyor.");
        return Task.FromResult(
            ServiceResult<Guid>.Fail(
                "Bu endpoint artık kullanılmıyor. /api/payments/confirm kullanın."
            )
        );
    }

    public Task HandleWebhookAsync(IyzicoWebhookDto webhook)
    {
        _logger.LogWarning("IyzicoWebhookDto: artık Stripe webhook kullanılıyor.");
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
            _logger.LogWarning("PaymentIntent metadata'da orderId yok: {Id}", intent.Id);
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
            "❌ Ödeme başarısız: OrderId={OrderId} IntentId={IntentId}",
            orderId,
            intent.Id
        );

        await _notification.SendOrderStatusNotificationAsync(
            orderId,
            $"Siparişinizin ödemesi başarısız oldu. Lütfen tekrar deneyin. Sipariş #{orderId.ToString()[..8].ToUpper()}"
        );
    }

    /// <summary>
    /// Ödeme başarılı olduğunda:
    ///   - Siparişi "Paid" olarak işaretle
    ///   - Fatura oluştur
    ///   - Fatura e-postası gönder
    ///   - Shipment oluştur
    /// </summary>
    private async Task<ServiceResult<Guid>> FinalizeOrderPaymentAsync(
        Guid orderId,
        string paymentIntentId
    )
    {
        var order = await _db
            .Orders.Include(o => o.Items)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return ServiceResult<Guid>.Fail("Sipariş bulunamadı.");

        if (order.IsPaid)
        {
            _logger.LogInformation("Sipariş zaten ödenmiş: {OrderId}", orderId);
            return ServiceResult<Guid>.Ok(orderId);
        }

        // Ödeme bilgilerini kaydet
        order.IsPaid = true;
        order.PaidAt = DateTime.UtcNow;
        order.PaymentId = paymentIntentId;
        order.Status = OrderStatus.PaymentConfirmed;
        order.UpdatedAt = DateTime.UtcNow;

        // Shipment oluştur
        var shipment = new api.Domain.Entities.Shipment
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
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "✅ Sipariş ödendi: OrderId={OrderId} IntentId={IntentId} TrackingNo={Tracking}",
            orderId,
            paymentIntentId,
            shipment.TrackingNumber
        );

        // Fatura oluştur (arka planda — hata olsa sipariş etkilenmesin)
        try
        {
            var invoice = await _invoiceGenerator.GenerateAndSaveAsync(order);
            if (!string.IsNullOrEmpty(invoice.PdfUrl))
                await _notification.SendInvoiceEmailAsync(orderId, invoice.PdfUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "⚠️ Fatura oluşturma hatası (sipariş etkilenmedi): OrderId={Id}",
                orderId
            );
        }

        // Ödeme bildirim e-postası
        try
        {
            await _notification.SendOrderStatusNotificationAsync(
                orderId,
                $"Siparişiniz #{orderId.ToString()[..8].ToUpper()} onaylandı! Takip numaranız: {shipment.TrackingNumber}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "⚠️ Bildirim hatası: OrderId={Id}", orderId);
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
