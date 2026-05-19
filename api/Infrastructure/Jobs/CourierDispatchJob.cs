using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — runs every 2 minutes.
/// For each shipment in PENDING/LABEL_GENERATED state with no courier assigned and no
/// dispatch attempts exhausted, calculates the Haversine distance to all online couriers
/// and auto-assigns the closest available one.
///
/// Retry policy: up to MaxDispatchAttempts. After each failed pass the VendorOrder's
/// DispatchAttempts counter is incremented; once the ceiling is hit the shipment
/// is flagged for manual intervention.
/// </summary>
public class CourierDispatchJob
{
    private const int MaxDispatchAttempts = 5;
    private const double MaxRadiusKm = 50.0;
    private static readonly TimeSpan LocationStaleness = TimeSpan.FromMinutes(30);

    private readonly AppDbContext _db;
    private readonly INotificationService _notification;
    private readonly ILogger<CourierDispatchJob> _logger;

    public CourierDispatchJob(
        AppDbContext db,
        INotificationService notification,
        ILogger<CourierDispatchJob> logger)
    {
        _db = db;
        _notification = notification;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        // Find unassigned shipments that are ready for dispatch
        var pendingShipments = await _db.Shipments
            .Include(s => s.Order).ThenInclude(o => o.Items)
            .Where(s =>
                s.CourierId == null &&
                (s.Status == ShipmentStatus.LabelGenerated || s.Status == ShipmentStatus.Pending))
            .ToListAsync();

        if (!pendingShipments.Any()) return;

        // Load available couriers with recent location data
        var locationCutoff = DateTime.UtcNow - LocationStaleness;
        var availableCouriers = await _db.Couriers
            .Include(c => c.User)
            .Where(c =>
                c.IsActive &&
                c.IsAvailable &&
                c.CurrentLatitude.HasValue &&
                c.CurrentLongitude.HasValue &&
                c.LastLocationUpdate.HasValue &&
                c.LastLocationUpdate.Value >= locationCutoff)
            .ToListAsync();

        if (!availableCouriers.Any())
        {
            _logger.LogWarning("CourierDispatchJob: no online couriers with recent location data.");
            return;
        }

        foreach (var shipment in pendingShipments)
        {
            try
            {
                await DispatchShipmentAsync(shipment, availableCouriers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dispatch failed for ShipmentId={Id}", shipment.Id);
            }
        }
    }

    private async Task DispatchShipmentAsync(Shipment shipment, List<Courier> couriers)
    {
        // Get the merchant's location for this shipment
        var firstItem = shipment.Order?.Items?.FirstOrDefault();
        if (firstItem == null) return;

        var merchant = await _db.MerchantProfiles
            .FirstOrDefaultAsync(m => m.Id == firstItem.MerchantId);
        if (merchant == null) return;

        // Find VendorOrder to track dispatch attempts
        var vendorOrder = await _db.VendorOrders
            .FirstOrDefaultAsync(vo =>
                vo.OrderId == shipment.OrderId &&
                vo.MerchantId == firstItem.MerchantId);

        if (vendorOrder != null && vendorOrder.DispatchAttempts >= MaxDispatchAttempts)
        {
            _logger.LogWarning(
                "ShipmentId={Id} exceeded MaxDispatchAttempts={Max} — manual intervention required.",
                shipment.Id, MaxDispatchAttempts);
            return;
        }

        // Sort couriers by Haversine distance from merchant
        var ranked = couriers
            .Select(c => new
            {
                Courier = c,
                DistanceKm = HaversineKm(
                    merchant.Latitude, merchant.Longitude,
                    c.CurrentLatitude!.Value, c.CurrentLongitude!.Value)
            })
            .Where(x => x.DistanceKm <= MaxRadiusKm)
            .OrderBy(x => x.DistanceKm)
            .ToList();

        if (!ranked.Any())
        {
            _logger.LogInformation(
                "No couriers within {Radius}km of merchant {MerchantId} for ShipmentId={ShipmentId}.",
                MaxRadiusKm, merchant.Id, shipment.Id);

            if (vendorOrder != null)
            {
                vendorOrder.DispatchAttempts++;
                vendorOrder.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return;
        }

        var chosen = ranked.First().Courier;

        // Assign courier
        shipment.CourierId = chosen.Id;
        shipment.Status = ShipmentStatus.CourierAssigned;
        shipment.UpdatedAt = DateTime.UtcNow;

        _db.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.CourierAssigned,
            Note = $"Auto-dispatched to courier {chosen.User.FirstName} {chosen.User.LastName} " +
                   $"({ranked.First().DistanceKm:F1} km from merchant)",
            ChangedAt = DateTime.UtcNow,
        });

        // Mirror on VendorOrder
        if (vendorOrder != null)
        {
            vendorOrder.Status = OrderStatus.CourierAssigned;
            vendorOrder.UpdatedAt = DateTime.UtcNow;
        }

        // Mirror on parent Order
        var order = await _db.Orders.FindAsync(shipment.OrderId);
        if (order != null)
        {
            order.Status = OrderStatus.CourierAssigned;
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Courier auto-dispatched: ShipmentId={ShipmentId} CourierId={CourierId} Distance={Distance:F1}km",
            shipment.Id, chosen.Id, ranked.First().DistanceKm);

        // Notify courier (fire-and-forget)
        _ = Task.Run(async () =>
        {
            try { await _notification.SendLabelReadySmsAsync(shipment.Id); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dispatch SMS failed: CourierId={Id}", chosen.Id);
            }
        });
    }

    /// <summary>
    /// Haversine formula — returns distance in kilometres between two lat/lon points.
    /// </summary>
    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180.0;
}
