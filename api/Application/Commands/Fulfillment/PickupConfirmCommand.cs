using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Fulfillment;

public record PickupConfirmCommand(Guid ShipmentId, Guid CourierUserId, string? Signature)
    : IRequest<ServiceResult<ShipmentDto>>;

public class PickupConfirmCommandHandler
    : IRequestHandler<PickupConfirmCommand, ServiceResult<ShipmentDto>>
{
    private readonly AppDbContext _context;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly INotificationService _notificationService;

    public PickupConfirmCommandHandler(
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
        PickupConfirmCommand request,
        CancellationToken cancellationToken
    )
    {
        var courier = await _context.Couriers.FirstOrDefaultAsync(
            c => c.UserId == request.CourierUserId,
            cancellationToken
        );
        if (courier == null)
            return ServiceResult<ShipmentDto>.Fail("Kurye profili bulunamadı.");

        var shipment = await _context
            .Shipments.Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(
                s => s.Id == request.ShipmentId && s.CourierId == courier.Id,
                cancellationToken
            );

        if (shipment == null)
            return ServiceResult<ShipmentDto>.Fail("Shipment bulunamadı veya yetkiniz yok.");

        if (shipment.Status != ShipmentStatus.CourierAssigned)
            return ServiceResult<ShipmentDto>.Fail(
                $"Bu işlem CourierAssigned durumunda yapılabilir. Mevcut: {shipment.Status}"
            );

        var note = request.Signature != null
            ? $"İmza alındı: {request.Signature}"
            : "Kurye tarafından teslim alındı.";

        try
        {
            await _fulfillmentService.TransitionStatusAsync(
                shipment,
                ShipmentStatus.PickedUp,
                note
            );
        }
        catch (InvalidOperationException ex)
        {
            return ServiceResult<ShipmentDto>.Fail(ex.Message);
        }

        _ = _notificationService.SendShipmentStatusNotificationAsync(
            shipment.Id,
            ShipmentStatus.PickedUp
        );

        return ServiceResult<ShipmentDto>.Ok(new ShipmentDto
        {
            Id = shipment.Id,
            OrderId = shipment.OrderId,
            CourierId = shipment.CourierId,
            Status = ShipmentStatus.PickedUp.ToString(),
            TrackingNumber = shipment.TrackingNumber,
            EstimatedDelivery = shipment.EstimatedDelivery,
            LabelUrl = shipment.LabelUrl,
            CreatedAt = shipment.CreatedAt,
        });
    }
}
