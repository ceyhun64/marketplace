using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Fulfillment;

public record AssignCourierCommand(Guid ShipmentId, Guid CourierId)
    : IRequest<ServiceResult<ShipmentDto>>;

public class AssignCourierCommandHandler
    : IRequestHandler<AssignCourierCommand, ServiceResult<ShipmentDto>>
{
    private readonly AppDbContext _context;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly INotificationService _notificationService;

    public AssignCourierCommandHandler(
        AppDbContext context,
        IFulfillmentService fulfillmentService,
        INotificationService notificationService
    )
    {
        _context = context;
        _fulfillmentService = fulfillmentService;
        _notificationService = notificationService;
    }

    public async Task<ServiceResult<ShipmentDto>> Handle(
        AssignCourierCommand request,
        CancellationToken cancellationToken
    )
    {
        var shipment = await _context
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
            return ServiceResult<ShipmentDto>.Fail("Shipment bulunamadı.");

        var courier = await _context.Couriers.FirstOrDefaultAsync(
            c => c.Id == request.CourierId && c.IsActive,
            cancellationToken
        );

        if (courier == null)
            return ServiceResult<ShipmentDto>.Fail("Aktif kurye bulunamadı.");

        shipment.CourierId = request.CourierId;
        shipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Kurye ve müşteriye bildirim gönder
        await _notificationService.SendCourierAssignedNotificationAsync(shipment);

        var dto = new ShipmentDto
        {
            Id = shipment.Id,
            OrderId = shipment.OrderId,
            CourierId = shipment.CourierId,
            Status = shipment.Status.ToString(),
            TrackingNumber = shipment.TrackingNumber,
            EstimatedDelivery = shipment.EstimatedDelivery,
            LabelUrl = shipment.LabelUrl,
        };

        return ServiceResult<ShipmentDto>.Ok(dto);
    }
}
