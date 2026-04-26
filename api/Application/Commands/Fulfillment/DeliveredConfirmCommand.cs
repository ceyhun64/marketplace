using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Fulfillment;

public record DeliveredConfirmCommand(
    Guid ShipmentId,
    Guid CourierUserId,
    string? RecipientName,
    string? PhotoUrl
) : IRequest<ServiceResult<ShipmentDto>>;

public class DeliveredConfirmCommandHandler
    : IRequestHandler<DeliveredConfirmCommand, ServiceResult<ShipmentDto>>
{
    private readonly AppDbContext _context;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly INotificationService _notificationService;

    public DeliveredConfirmCommandHandler(
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
        DeliveredConfirmCommand request,
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
            .Include(s => s.Order)
            .FirstOrDefaultAsync(
                s => s.Id == request.ShipmentId && s.CourierId == courier.Id,
                cancellationToken
            );

        if (shipment == null)
            return ServiceResult<ShipmentDto>.Fail("Shipment bulunamadı veya yetkiniz yok.");

        if (
            shipment.Status != ShipmentStatus.InTransit
            && shipment.Status != ShipmentStatus.OutForDelivery
            && shipment.Status != ShipmentStatus.PickedUp
        )
            return ServiceResult<ShipmentDto>.Fail(
                $"Teslim işlemi bu durumda yapılamaz. Mevcut: {shipment.Status}"
            );

        var noteParts = new List<string> { "Teslim edildi." };
        if (!string.IsNullOrEmpty(request.RecipientName))
            noteParts.Add($"Teslim alan: {request.RecipientName}");
        if (!string.IsNullOrEmpty(request.PhotoUrl))
            noteParts.Add($"Fotoğraf: {request.PhotoUrl}");

        // OutForDelivery durumuna geçip ardından Delivered'a geç
        if (shipment.Status == ShipmentStatus.PickedUp || shipment.Status == ShipmentStatus.InTransit)
        {
            try
            {
                await _fulfillmentService.TransitionStatusAsync(
                    shipment,
                    ShipmentStatus.OutForDelivery,
                    "Teslimat bölgesine ulaşıldı."
                );
            }
            catch { /* Zaten OutForDelivery ise devam et */ }
        }

        try
        {
            await _fulfillmentService.TransitionStatusAsync(
                shipment,
                ShipmentStatus.Delivered,
                string.Join(" | ", noteParts)
            );
        }
        catch (InvalidOperationException ex)
        {
            return ServiceResult<ShipmentDto>.Fail(ex.Message);
        }

        _ = _notificationService.SendShipmentStatusNotificationAsync(
            shipment.Id,
            ShipmentStatus.Delivered
        );

        return ServiceResult<ShipmentDto>.Ok(new ShipmentDto
        {
            Id = shipment.Id,
            OrderId = shipment.OrderId,
            CourierId = shipment.CourierId,
            Status = ShipmentStatus.Delivered.ToString(),
            TrackingNumber = shipment.TrackingNumber,
            EstimatedDelivery = shipment.EstimatedDelivery,
            LabelUrl = shipment.LabelUrl,
            CreatedAt = shipment.CreatedAt,
        });
    }
}
