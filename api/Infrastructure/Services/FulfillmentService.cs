using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Hubs;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace api.Infrastructure.Services;

public class FulfillmentService : IFulfillmentService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<TrackingHub> _hub;
    private readonly INotificationService _notificationService;
    private readonly IWalletService _walletService;
    private readonly ILogger<FulfillmentService> _logger;

    public FulfillmentService(
        AppDbContext db,
        IHubContext<TrackingHub> hub,
        INotificationService notificationService,
        IWalletService walletService,
        ILogger<FulfillmentService> logger
    )
    {
        _db = db;
        _hub = hub;
        _notificationService = notificationService;
        _walletService = walletService;
        _logger = logger;
    }

    private static readonly Dictionary<ShipmentStatus, ShipmentStatus[]> ValidTransitions = new()
    {
        [ShipmentStatus.Pending] = [ShipmentStatus.LabelGenerated, ShipmentStatus.CourierAssigned],
        [ShipmentStatus.LabelGenerated] = [ShipmentStatus.CourierAssigned, ShipmentStatus.Failed],
        [ShipmentStatus.CourierAssigned] = [ShipmentStatus.PickedUp, ShipmentStatus.Failed],
        [ShipmentStatus.PickedUp] = [ShipmentStatus.InTransit, ShipmentStatus.Failed],
        [ShipmentStatus.InTransit] = [ShipmentStatus.OutForDelivery, ShipmentStatus.Failed],
        [ShipmentStatus.OutForDelivery] = [ShipmentStatus.Delivered, ShipmentStatus.Failed],
        [ShipmentStatus.Delivered] = [],
        [ShipmentStatus.Failed] = [],
    };

    public async Task TransitionStatusAsync(
        Shipment shipment,
        ShipmentStatus newStatus,
        string? note = null
    )
    {
        if (
            !ValidTransitions.TryGetValue(shipment.Status, out var allowed)
            || !allowed.Contains(newStatus)
        )
            throw new InvalidOperationException(
                $"Cannot transition from '{shipment.Status}' to '{newStatus}'."
            );

        var previousStatus = shipment.Status;
        shipment.Status = newStatus;
        shipment.UpdatedAt = DateTime.UtcNow;

        _db.ShipmentStatusHistories.Add(
            new ShipmentStatusHistory
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                Status = newStatus,
                Note = note,
                ChangedAt = DateTime.UtcNow,
            }
        );

        var order = await _db.Orders.FindAsync(shipment.OrderId);
        if (order != null)
        {
            order.Status = MapToOrderStatus(newStatus);
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Shipment {Id} {From} → {To}",
            shipment.Id,
            previousStatus,
            newStatus
        );

        // On DELIVERED: move VendorOrder funds into escrow (pending settlement)
        if (newStatus == ShipmentStatus.Delivered)
        {
            var vendorOrders = await _db
                .VendorOrders.Where(vo => vo.OrderId == shipment.OrderId && vo.SettledAt == null)
                .ToListAsync();

            foreach (var vo in vendorOrders)
            {
                vo.Status = OrderStatus.Delivered;
                vo.UpdatedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();

            // Fire-and-forget: hold escrow per vendor order
            _ = Task.Run(async () =>
            {
                foreach (var vo in vendorOrders)
                {
                    try
                    {
                        await _walletService.HoldEscrowAsync(vo);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Escrow hold failed: VendorOrderId={Id}", vo.Id);
                    }
                }
            });
        }

        await _hub
            .Clients.Group($"shipment-{shipment.Id}")
            .SendAsync(
                "ShipmentStatusUpdated",
                new
                {
                    shipmentId = shipment.Id,
                    previousStatus = previousStatus.ToString(),
                    newStatus = newStatus.ToString(),
                    note,
                    timestamp = DateTime.UtcNow,
                }
            );

        // Safe fire-and-forget — unobserved exceptions are not swallowed
        var shipmentIdForLog = shipment.Id;
        var orderIdForNotif = shipment.OrderId.ToString();
        var statusForNotif = newStatus.ToString();
        _ = Task.Run(async () =>
        {
            try
            {
                await _notificationService.SendOrderUpdateNotificationAsync(
                    orderIdForNotif,
                    $"Shipment status updated: {statusForNotif}"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send shipment status notification: ShipmentId={Id}",
                    shipmentIdForLog
                );
            }
        });
    }

    public async Task<Shipment> CreateShipmentForOrderAsync(Order order)
    {
        var shipment = BuildShipment(order.Id, null, order.ShippingRate);
        await PersistShipmentAsync(shipment);
        return shipment;
    }

    /// <summary>
    /// Creates one independent shipment per VendorOrder so each merchant's
    /// fulfilment can be tracked and delivered separately.
    /// </summary>
    public async Task<Shipment> CreateShipmentForVendorOrderAsync(
        VendorOrder vendorOrder,
        Order order)
    {
        var shipment = BuildShipment(order.Id, vendorOrder.Id, order.ShippingRate);
        await PersistShipmentAsync(shipment);
        return shipment;
    }

    private Shipment BuildShipment(Guid orderId, Guid? vendorOrderId, ShippingRate rate)
    {
        // Prefix "TR" + unix seconds + 4-digit random makes tracking numbers
        // unique enough for development and staging. Production deployments
        // should replace this with a carrier-issued barcode.
        var trackingNumber =
            $"TR{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{Random.Shared.Next(1000, 9999)}".ToUpper();

        return new Shipment
        {
            Id               = Guid.NewGuid(),
            OrderId          = orderId,
            VendorOrderId    = vendorOrderId,
            Status           = ShipmentStatus.Pending,
            TrackingNumber   = trackingNumber,
            EstimatedDelivery = DateTime.UtcNow.AddDays(
                rate == ShippingRate.Express ? 1 : 3),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    private async Task PersistShipmentAsync(Shipment shipment)
    {
        _db.Shipments.Add(shipment);
        _db.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            Id         = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status     = ShipmentStatus.Pending,
            Note       = "Shipment record created.",
            ChangedAt  = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    private static OrderStatus MapToOrderStatus(ShipmentStatus s) =>
        s switch
        {
            ShipmentStatus.CourierAssigned => OrderStatus.CourierAssigned,
            ShipmentStatus.PickedUp => OrderStatus.PickedUp,
            ShipmentStatus.InTransit => OrderStatus.InTransit,
            ShipmentStatus.OutForDelivery => OrderStatus.OutForDelivery,
            ShipmentStatus.Delivered => OrderStatus.Delivered,
            ShipmentStatus.Failed => OrderStatus.Failed,
            _ => OrderStatus.Pending,
        };
}
