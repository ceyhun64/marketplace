using api.Domain.Enums;

namespace api.Infrastructure.Services;

public interface IFulfillmentService
{
    Task<bool> TransitionStatusAsync(Guid shipmentId, ShipmentStatus newStatus);
    Task<Guid> CreateShipmentForOrderAsync(Guid orderId);
    Task<bool> AssignCourierAsync(Guid shipmentId, Guid courierId);
}
