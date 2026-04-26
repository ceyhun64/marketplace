using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Fulfillment;

public record UpdateShipmentStatusCommand(Guid ShipmentId, string NewStatus, string? Note)
    : IRequest<ServiceResult<ShipmentDto>>;

public class UpdateShipmentStatusCommandHandler
    : IRequestHandler<UpdateShipmentStatusCommand, ServiceResult<ShipmentDto>>
{
    private readonly AppDbContext _context;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly INotificationService _notificationService;

    public UpdateShipmentStatusCommandHandler(
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
        UpdateShipmentStatusCommand request,
        CancellationToken cancellationToken
    )
    {
        if (!Enum.TryParse<ShipmentStatus>(request.NewStatus, true, out var newStatus))
            return ServiceResult<ShipmentDto>.Fail($"Geçersiz durum: {request.NewStatus}");

        var shipment = await _context
            .Shipments.Include(s => s.StatusHistory)
            .Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
            return ServiceResult<ShipmentDto>.Fail("Shipment bulunamadı.");

        try
        {
            await _fulfillmentService.TransitionStatusAsync(shipment, newStatus, request.Note);
        }
        catch (InvalidOperationException ex)
        {
            return ServiceResult<ShipmentDto>.Fail(ex.Message);
        }

        // Kargo durum değişikliği bildirimi (SMS + e-posta)
        _ = _notificationService.SendShipmentStatusNotificationAsync(
            shipment.Id,
            newStatus,
            request.Note
        );

        var dto = new ShipmentDto
        {
            Id = shipment.Id,
            OrderId = shipment.OrderId,
            CourierId = shipment.CourierId,
            CourierName =
                shipment.Courier != null
                    ? $"{shipment.Courier.User?.FirstName} {shipment.Courier.User?.LastName}".Trim()
                    : null,
            Status = newStatus.ToString(),
            TrackingNumber = shipment.TrackingNumber,
            EstimatedDelivery = shipment.EstimatedDelivery,
            LabelUrl = shipment.LabelUrl,
            History = shipment
                .StatusHistory.OrderByDescending(h => h.ChangedAt)
                .Select(h => new ShipmentStatusHistoryDto
                {
                    Status = h.Status.ToString(),
                    Note = h.Note,
                    ChangedAt = h.ChangedAt,
                })
                .ToList(),
            CreatedAt = shipment.CreatedAt,
        };

        return ServiceResult<ShipmentDto>.Ok(dto);
    }
}
