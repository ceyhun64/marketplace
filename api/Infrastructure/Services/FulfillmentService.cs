using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Hubs;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace api.Infrastructure.Services;

public class FulfillmentService : IFulfillmentService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<TrackingHub> _hub;
    private readonly INotificationService _notificationService;
    private readonly ILogger<FulfillmentService> _logger;

    public FulfillmentService(
        AppDbContext db,
        IHubContext<TrackingHub> hub,
        INotificationService notificationService,
        ILogger<FulfillmentService> logger
    )
    {
        _db = db;
        _hub = hub;
        _notificationService = notificationService;
        _logger = logger;
    }

    // Geçerli durum geçiş tablosu
    private static readonly Dictionary<ShipmentStatus, ShipmentStatus[]> ValidTransitions = new()
    {
        [ShipmentStatus.Pending] = [ShipmentStatus.CourierAssigned],
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
        // Geçiş geçerli mi?
        if (
            !ValidTransitions.TryGetValue(shipment.Status, out var allowed)
            || !allowed.Contains(newStatus)
        )
            throw new InvalidOperationException(
                $"'{shipment.Status}' durumundan '{newStatus}' durumuna geçiş yapılamaz."
            );

        var previousStatus = shipment.Status;
        shipment.Status = newStatus;
        shipment.UpdatedAt = DateTime.UtcNow;

        // Geçmiş kaydı
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

        // Bağlı siparişin durumunu da güncelle
        var order = await _db.Orders.FindAsync(shipment.OrderId);
        if (order != null)
        {
            order.Status = MapToOrderStatus(newStatus);
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Shipment {Id} transitioned {From} → {To}",
            shipment.Id,
            previousStatus,
            newStatus
        );

        // SignalR: ilgili gruba canlı bildirim
        await _hub
            .Clients.Group($"shipment-{shipment.Id}")
            .SendAsync(
                "StatusUpdated",
                new
                {
                    shipmentId = shipment.Id,
                    previousStatus = previousStatus.ToString(),
                    newStatus = newStatus.ToString(),
                    note,
                    timestamp = DateTime.UtcNow,
                }
            );

        // E-posta / SMS (fire-and-forget — API yanıtını yavaşlatmasın)
        _ = _notificationService.SendOrderUpdateNotificationAsync(
            shipment.OrderId.ToString(),
            $"Kargo durumu güncellendi: {newStatus}"
        );
    }

    public async Task<Shipment> CreateShipmentForOrderAsync(Order order)
    {
        var trackingNumber = GenerateTrackingNumber();

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = ShipmentStatus.Pending,
            TrackingNumber = trackingNumber,
            EstimatedDelivery = DateTime.UtcNow.AddDays(
                order.ShippingRate == ShippingRate.Express ? 1 : 3
            ),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Shipments.Add(shipment);

        _db.ShipmentStatusHistories.Add(
            new ShipmentStatusHistory
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                Status = ShipmentStatus.Pending,
                Note = "Kargo kaydı oluşturuldu.",
                ChangedAt = DateTime.UtcNow,
            }
        );

        await _db.SaveChangesAsync();
        return shipment;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

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

    private static string GenerateTrackingNumber()
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var rnd = new Random().Next(1000, 9999);
        return $"TR{ts}{rnd}".ToUpper();
    }
}
