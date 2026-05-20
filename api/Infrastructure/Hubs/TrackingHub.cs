using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace api.Infrastructure.Hubs;

/// <summary>
/// SignalR hub — real-time shipment tracking.
/// Groups:
///   - "shipment-{shipmentId}" → customer / seller / admin
///   - "admin-tracking"        → admin panel general monitoring
///   - "courier-{courierId}"   → courier in their own group
/// </summary>
[Authorize]
public class TrackingHub : Hub
{
    private readonly ILogger<TrackingHub> _logger;

    public TrackingHub(ILogger<TrackingHub> logger)
    {
        _logger = logger;
    }

    /// <summary>Customer/seller: join the group to track a specific shipment.</summary>
    public async Task JoinShipmentGroup(string shipmentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"shipment-{shipmentId}");
        _logger.LogDebug(
            "Client {Id} joined shipment-{ShipmentId}",
            Context.ConnectionId,
            shipmentId
        );
    }

    public async Task LeaveShipmentGroup(string shipmentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"shipment-{shipmentId}");
    }

    /// <summary>Admin: join the admin group to listen to all shipment events.</summary>
    public async Task JoinAdminTracking()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "admin-tracking");
    }

    /// <summary>Courier: join their own group — for assignment notifications.</summary>
    public async Task JoinCourierGroup(string courierId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"courier-{courierId}");
        _logger.LogDebug("Courier {CourierId} joined courier group", courierId);
    }

    /// <summary>
    /// Courier: sends a location update.
    /// Forwarded to both the shipment group and the admin group.
    /// </summary>
    public async Task UpdateLocation(string shipmentId, double lat, double lng)
    {
        var payload = new
        {
            shipmentId,
            latitude = lat,
            longitude = lng,
            timestamp = DateTime.UtcNow,
        };

        await Clients.Group($"shipment-{shipmentId}").SendAsync("LocationUpdated", payload);
        await Clients.Group("admin-tracking").SendAsync("CourierLocationUpdated", payload);
    }

    /// <summary>Legacy method — retained for backward compatibility.</summary>
    public async Task JoinOrderGroup(string orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Order_{orderId}");
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogDebug("SignalR connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogDebug("SignalR disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
