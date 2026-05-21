using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire job that runs all post-payment side effects for a confirmed order.
///
/// Why this exists (Outbox Pattern rationale):
///   After FinalizeOrderPaymentAsync commits the payment to the DB, secondary
///   operations (invoice generation, confirmation email) must not be executed
///   inline because:
///     1. They can fail independently (PDF library crash, SendGrid timeout).
///     2. If they fail, there must be a retry path — inline try/catch has none.
///     3. Stripe may retry the webhook if we return 500; without idempotency on
///        the side-effects, they would run twice.
///
/// Hangfire guarantees:
///   - Exactly-once execution per job ID (stored in PostgreSQL).
///   - Automatic retries with exponential back-off (default: 10 attempts).
///   - Job is only enqueued AFTER the payment transaction commits, so no
///     side-effects run if the main transaction rolls back.
///
/// Idempotency guarantee:
///   Each operation checks whether it has already been performed:
///     • Invoice: GenerateAndSaveAsync checks if order.Invoice already exists.
///     • Notification: SendOrderStatusNotificationAsync is a fire-and-forget
///       email — re-sending is preferable to missing it entirely.
/// </summary>
public class PostPaymentSideEffectsJob
{
    private readonly AppDbContext _db;
    private readonly IInvoiceGeneratorService _invoiceGenerator;
    private readonly INotificationService _notification;
    private readonly ILogger<PostPaymentSideEffectsJob> _logger;

    public PostPaymentSideEffectsJob(
        AppDbContext db,
        IInvoiceGeneratorService invoiceGenerator,
        INotificationService notification,
        ILogger<PostPaymentSideEffectsJob> logger)
    {
        _db = db;
        _invoiceGenerator = invoiceGenerator;
        _notification = notification;
        _logger = logger;
    }

    /// <summary>
    /// Called by Hangfire after a successful payment commit.
    /// Hangfire will retry this method (up to 10 times, exponential back-off)
    /// if it throws. All operations must be idempotent.
    /// </summary>
    public async Task RunAsync(Guid orderId, string trackingNumber)
    {
        _logger.LogInformation("PostPaymentSideEffectsJob starting: OrderId={OrderId}", orderId);

        var order = await _db
            .Orders.Include(o => o.Items)
            .Include(o => o.Customer)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
        {
            _logger.LogWarning("PostPaymentSideEffectsJob: order {OrderId} not found — skipping.", orderId);
            return;
        }

        // ── 1. Invoice generation ─────────────────────────────────────────────
        // Skip if an invoice was already generated (idempotency guard).
        if (order.Invoice is null)
        {
            try
            {
                var invoice = await _invoiceGenerator.GenerateAndSaveAsync(order);

                if (!string.IsNullOrEmpty(invoice.PdfUrl))
                    await _notification.SendInvoiceEmailAsync(orderId, invoice.PdfUrl);

                _logger.LogInformation(
                    "Invoice generated: OrderId={OrderId} InvoiceId={InvoiceId}",
                    orderId, invoice.Id);
            }
            catch (Exception ex)
            {
                // Re-throw so Hangfire retries this job
                _logger.LogError(ex, "Invoice generation failed for OrderId={OrderId}", orderId);
                throw;
            }
        }
        else
        {
            _logger.LogDebug("Invoice already exists for OrderId={OrderId} — skipping generation.", orderId);
        }

        // ── 2. Order confirmation notification ────────────────────────────────
        try
        {
            await _notification.SendOrderStatusNotificationAsync(
                orderId,
                $"Your order #{orderId.ToString()[..8].ToUpper()} has been confirmed! " +
                $"Tracking number: {trackingNumber}");
        }
        catch (Exception ex)
        {
            // Notification failure is non-critical — log but don't retry the entire job
            _logger.LogWarning(ex, "Confirmation notification failed for OrderId={OrderId}", orderId);
        }

        _logger.LogInformation("PostPaymentSideEffectsJob completed: OrderId={OrderId}", orderId);
    }
}
