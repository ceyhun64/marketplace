using api.Domain.Enums;

namespace api.Infrastructure.Services;

public class FulfillmentService : IFulfillmentService
{
    private readonly ILogger<FulfillmentService> _logger;

    public FulfillmentService(ILogger<FulfillmentService> logger)
    {
        _logger = logger;
    }

    public Task<bool> TransitionStatusAsync(Guid shipmentId, ShipmentStatus newStatus)
    {
        _logger.LogInformation(
            "Transitioning shipment {ShipmentId} to {Status}",
            shipmentId,
            newStatus
        );
        // TODO: Implement state machine logic
        return Task.FromResult(true);
    }

    public Task<Guid> CreateShipmentForOrderAsync(Guid orderId)
    {
        // TODO: Create shipment record, generate tracking number
        return Task.FromResult(Guid.NewGuid());
    }

    public Task<bool> AssignCourierAsync(Guid shipmentId, Guid courierId)
    {
        // TODO: Assign courier, update status to COURIER_ASSIGNED
        return Task.FromResult(true);
    }
}
