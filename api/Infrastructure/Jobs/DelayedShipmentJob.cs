using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — runs every hour.
/// Detects shipments whose EstimatedDelivery has passed and have not been delivered,
/// then sends notifications to the merchant and the customer.
/// </summary>
public class DelayedShipmentJob
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<DelayedShipmentJob> _logger;

    public DelayedShipmentJob(
        AppDbContext context,
        INotificationService notificationService,
        ILogger<DelayedShipmentJob> logger
    )
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation(
            "[DelayedShipmentJob] Delayed shipment check started: {Time}",
            DateTime.UtcNow
        );

        var activeStatuses = new[]
        {
            ShipmentStatus.CourierAssigned,
            ShipmentStatus.PickedUp,
            ShipmentStatus.InTransit,
            ShipmentStatus.OutForDelivery,
        };

        var delayedShipments = await _context
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .Include(s => s.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Merchant)
                            .ThenInclude(m => m.User)
            .Where(s => activeStatuses.Contains(s.Status) && s.EstimatedDelivery < DateTime.UtcNow)
            .ToListAsync();

        _logger.LogInformation(
            "[DelayedShipmentJob] {Count} delayed shipment(s) found.",
            delayedShipments.Count
        );

        foreach (var shipment in delayedShipments)
        {
            var hoursLate = (int)
                Math.Ceiling((DateTime.UtcNow - shipment.EstimatedDelivery).TotalHours);

            _logger.LogWarning(
                "[DelayedShipmentJob] Delayed Shipment={Id} TrackingNo={TrackingNo} HoursLate={Hours}",
                shipment.Id,
                shipment.TrackingNumber,
                hoursLate
            );

            // Customer notification
            var customerEmail = shipment.Order?.Customer?.Email;
            if (!string.IsNullOrEmpty(customerEmail))
            {
                await _notificationService.SendEmailAsync(
                    customerEmail,
                    $"Shipment Delay — Tracking: {shipment.TrackingNumber}",
                    $"The delivery of your order is {hoursLate} hour(s) late. "
                        + $"Your tracking number is: {shipment.TrackingNumber}. "
                        + "Please contact us for support."
                );
            }

            // Merchant email is retrieved via OrderItems
            var merchantEmail = shipment
                .Order?.Items.Select(i => i.Product?.Merchant?.User?.Email)
                .FirstOrDefault(e => !string.IsNullOrEmpty(e));
            if (!string.IsNullOrEmpty(merchantEmail))
            {
                await _notificationService.SendEmailAsync(
                    merchantEmail,
                    $"Shipment Delay Warning — Order #{shipment.OrderId}",
                    $"The shipment for Order #{shipment.OrderId} appears to be {hoursLate} hour(s) late. "
                        + $"Tracking no: {shipment.TrackingNumber}. Please contact the courier."
                );
            }

            // SignalR notification (OrderStatusNotification)
            await _notificationService.SendOrderStatusNotificationAsync(
                shipment.OrderId,
                $"Shipment delay detected. Tracking: {shipment.TrackingNumber}"
            );
        }

        _logger.LogInformation("[DelayedShipmentJob] Completed.");
    }
}
