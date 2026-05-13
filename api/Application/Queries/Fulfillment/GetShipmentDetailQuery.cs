using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Fulfillment;

public record GetShipmentDetailQuery(Guid ShipmentId, string RequestorRole, Guid RequestorUserId)
    : IRequest<ServiceResult<ShipmentDto>>;

public class GetShipmentDetailQueryHandler
    : IRequestHandler<GetShipmentDetailQuery, ServiceResult<ShipmentDto>>
{
    private readonly AppDbContext _context;

    public GetShipmentDetailQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<ShipmentDto>> Handle(
        GetShipmentDetailQuery request,
        CancellationToken cancellationToken
    )
    {
        var shipment = await _context
            .Shipments.Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .Include(s => s.StatusHistory)
            .Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .Include(s => s.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
            return ServiceResult<ShipmentDto>.Fail("Shipment bulunamadı.");

        // Kurye sadece kendi atandığı paketleri görebilir
        if (request.RequestorRole == "Courier")
        {
            var courier = await _context.Couriers.FirstOrDefaultAsync(
                c => c.UserId == request.RequestorUserId,
                cancellationToken
            );
            if (courier == null || shipment.CourierId != courier.Id)
                return ServiceResult<ShipmentDto>.Fail("Bu shipment'a erişim yetkiniz yok.");
        }

        var dto = new ShipmentDto
        {
            Id = shipment.Id,
            OrderId = shipment.OrderId,
            CourierId = shipment.CourierId,
            CourierName =
                shipment.Courier != null
                    ? $"{shipment.Courier.User?.FirstName} {shipment.Courier.User?.LastName}".Trim()
                    : null,
            Status = shipment.Status.ToString(),
            TrackingNumber = shipment.TrackingNumber,
            EstimatedDelivery = shipment.EstimatedDelivery,
            LabelUrl = shipment.LabelUrl,
            Events = shipment
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
