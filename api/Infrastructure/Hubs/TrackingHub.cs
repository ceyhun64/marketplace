using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace api.Infrastructure.Hubs;

/// <summary>
/// SignalR hub — gerçek zamanlı kargo takibi.
/// Gruplar:
///   - "shipment-{shipmentId}" → müşteri / satıcı / admin
///   - "admin-tracking"        → admin panel genel izleme
///   - "courier-{courierId}"   → kurye kendi grubunda
/// </summary>
[Authorize]
public class TrackingHub : Hub
{
    private readonly ILogger<TrackingHub> _logger;

    public TrackingHub(ILogger<TrackingHub> logger)
    {
        _logger = logger;
    }

    /// <summary>Müşteri/satıcı: belirli bir shipment'ı izlemek için gruba katıl.</summary>
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

    /// <summary>Admin: tüm kargo olaylarını dinlemek için admin grubuna katıl.</summary>
    public async Task JoinAdminTracking()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "admin-tracking");
    }

    /// <summary>Kurye: kendi grubuna katıl — atama bildirimleri için.</summary>
    public async Task JoinCourierGroup(string courierId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"courier-{courierId}");
        _logger.LogDebug("Courier {CourierId} joined courier group", courierId);
    }

    /// <summary>
    /// Kurye: konum güncellemesi gönderir.
    /// Hem shipment grubuna hem admin grubuna iletilir.
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

    /// <summary>Eski method — geriye dönük uyumluluk için korundu.</summary>
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
