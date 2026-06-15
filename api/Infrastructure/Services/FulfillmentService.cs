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

        var mappedOrderStatus = MapToOrderStatus(newStatus);

        // Update only the VendorOrder this shipment belongs to — per-merchant
        // shipments must not bleed their status into sibling merchants' sub-orders.
        // Legacy single-shipment orders (VendorOrderId == null) fall back to mirroring all.
        var vendorOrders = await _db.VendorOrders
            .Where(vo => vo.OrderId == shipment.OrderId)
            .ToListAsync();

        var updatedVendorOrders = shipment.VendorOrderId.HasValue
            ? vendorOrders.Where(vo => vo.Id == shipment.VendorOrderId.Value).ToList()
            : vendorOrders;

        foreach (var vo in updatedVendorOrders)
        {
            vo.Status = mappedOrderStatus;
            vo.UpdatedAt = DateTime.UtcNow;
        }

        // Mirror to the parent Order only once every VendorOrder has reached this
        // status — otherwise the order-level status would prematurely jump ahead
        // of sibling merchants whose shipments haven't progressed yet.
        var order = await _db.Orders.FindAsync(shipment.OrderId);
        if (order != null && vendorOrders.Count > 0 && vendorOrders.All(vo => vo.Status == mappedOrderStatus))
        {
            order.Status = mappedOrderStatus;
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Shipment {Id} {From} → {To}",
            shipment.Id,
            previousStatus,
            newStatus
        );

        // On DELIVERED: settle escrow — move funds from PendingBalance to AvailableBalance.
        // HoldEscrowAsync was already called when the order was created; calling it again
        // here would double-count the PendingBalance. SettleVendorOrderAsync is the correct
        // follow-up: it decrements PendingBalance and increments AvailableBalance.
        // Only settle the VendorOrder(s) this shipment actually transitioned —
        // sibling merchants' sub-orders are unaffected until their own shipment delivers.
        if (newStatus == ShipmentStatus.Delivered)
        {
            _ = Task.Run(async () =>
            {
                foreach (var vo in updatedVendorOrders.Where(v => v.SettledAt == null))
                {
                    try
                    {
                        await _walletService.SettleVendorOrderAsync(vo);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Escrow settlement failed: VendorOrderId={Id}", vo.Id);
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
                rate == ShippingRate.Express ? 2 : 5),
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
