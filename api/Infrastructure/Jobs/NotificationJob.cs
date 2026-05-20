using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — runs every minute.
/// Tasks:
///   1. New order notifications — sends a "new order received" email to the merchant
///   2. Delivery thank-you email (delivered, not yet sent)
///   3. Cancellation notifications (Cancelled, last 5 minutes)
/// </summary>
public class NotificationJob
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationJob> _logger;

    public NotificationJob(
        AppDbContext context,
        INotificationService notificationService,
        ILogger<NotificationJob> logger
    )
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation("[NotificationJob] Started: {Time}", DateTime.UtcNow);

        await NotifyMerchantsForNewOrdersAsync();
        await SendDeliveryThankYouAsync();
        await NotifyCancelledOrdersAsync();

        _logger.LogInformation("[NotificationJob] Completed.");
    }

    // ── 1. Notify merchant on new orders ────────────────────────────────────

    /// <summary>
    /// Finds orders created in the last 2 minutes with payment confirmed
    /// and sends a "new order" email to the relevant merchant.
    /// (Since Hangfire runs every minute, a 2-minute window provides sufficient buffer.)
    /// </summary>
    private async Task NotifyMerchantsForNewOrdersAsync()
    {
        var since = DateTime.UtcNow.AddMinutes(-2);

        var newOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Merchant)
                        .ThenInclude(m => m.User)
            .Where(o =>
                o.Status == OrderStatus.PaymentConfirmed
                && o.CreatedAt >= since
            )
            .ToListAsync();

        if (newOrders.Count == 0)
            return;

        _logger.LogInformation(
            "[NotificationJob] Sending {Count} new order notification(s).",
            newOrders.Count
        );

        foreach (var order in newOrders)
        {
            // Find all merchants in this order (usually a single merchant)
            var merchantEmails = order
                .Items.Select(i => i.Product?.Merchant?.User?.Email)
                .Where(e => !string.IsNullOrEmpty(e))
                .Distinct()
                .ToList();

            foreach (var email in merchantEmails)
            {
                if (email == null)
                    continue;

                var shortId = order.Id.ToString()[..8].ToUpper();
                var itemCount = order.Items.Count;
                var total = order.TotalAmount;

                await _notificationService.SendEmailAsync(
                    email,
                    $"🛒 New Order — #{shortId}",
                    $"""
                    You have a new order!

                    Order No: #{shortId}
                    Customer: {order.Customer?.FirstName} {order.Customer?.LastName}
                    Item Count: {itemCount}
                    Total: {total:C2}
                    Shipping: {order.ShippingRate}

                    Log in to your merchant panel to prepare the order.
                    """
                );

                _logger.LogInformation(
                    "[NotificationJob] Merchant notified: {Email} — Order={OrderId}",
                    email,
                    order.Id
                );
            }
        }
    }

    // ── 2. Post-delivery thank-you email ────────────────────────────────────

    /// <summary>
    /// Sends a thank-you email to the customer for orders
    /// that were delivered in the last 5 minutes.
    /// </summary>
    private async Task SendDeliveryThankYouAsync()
    {
        var since = DateTime.UtcNow.AddMinutes(-5);

        var deliveredOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Where(o =>
                o.Status == OrderStatus.Delivered
                && o.UpdatedAt >= since
            )
            .ToListAsync();

        foreach (var order in deliveredOrders)
        {
            if (order.Customer == null)
                continue;

            var shortId = order.Id.ToString()[..8].ToUpper();
            var firstProduct = order.Items.FirstOrDefault()?.ProductName ?? "your product";

            await _notificationService.SendEmailAsync(
                order.Customer.Email,
                $"Thank you! Your order has been delivered — #{shortId}",
                $"""
                Hello {order.Customer.FirstName},

                Your order #{shortId} has been successfully delivered! 🎉

                Enjoy "{firstProduct}" and your other items.

                You can log in to your account to leave a review.

                Have a great day!
                """
            );

            _logger.LogInformation(
                "[NotificationJob] Thank-you email sent: {Email} — Order={OrderId}",
                order.Customer.Email,
                order.Id
            );
        }
    }

    // ── 3. Cancellation notification ────────────────────────────────────────

    /// <summary>
    /// Sends notifications to both the customer and the merchant
    /// for orders cancelled in the last 5 minutes.
    /// </summary>
    private async Task NotifyCancelledOrdersAsync()
    {
        var since = DateTime.UtcNow.AddMinutes(-5);

        var cancelledOrders = await _context
            .Orders.Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Merchant)
                        .ThenInclude(m => m.User)
            .Where(o =>
                o.Status == OrderStatus.Cancelled
                && o.UpdatedAt >= since
            )
            .ToListAsync();

        foreach (var order in cancelledOrders)
        {
            if (order.Customer == null)
                continue;

            var shortId = order.Id.ToString()[..8].ToUpper();
            var reason = string.IsNullOrEmpty(order.CancellationReason)
                ? "Not specified"
                : order.CancellationReason;

            // Customer notification
            await _notificationService.SendEmailAsync(
                order.Customer.Email,
                $"Your Order Has Been Cancelled — #{shortId}",
                $"""
                Hello {order.Customer.FirstName},

                Your order #{shortId} has been cancelled.
                Cancellation Reason: {reason}

                If a payment was made, the refund will be reflected in your account within 3-5 business days.

                Please contact our support line if you have any questions.
                """
            );

            // Merchant notification
            var merchantEmail = order
                .Items.Select(i => i.Product?.Merchant?.User?.Email)
                .FirstOrDefault(e => !string.IsNullOrEmpty(e));

            if (!string.IsNullOrEmpty(merchantEmail))
            {
                await _notificationService.SendEmailAsync(
                    merchantEmail,
                    $"Order Cancelled — #{shortId}",
                    $"""
                    Order #{shortId} has been cancelled.
                    Cancellation Reason: {reason}

                    Your stock quantities have been updated automatically.
                    """
                );
            }

            _logger.LogInformation(
                "[NotificationJob] Cancellation notification sent: Order={OrderId}",
                order.Id
            );
        }
    }
}
