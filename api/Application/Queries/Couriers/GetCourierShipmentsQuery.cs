using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Couriers;

public record GetCourierShipmentsQuery(Guid CourierUserId, string? Status)
    : IRequest<ServiceResult<IEnumerable<ShipmentDto>>>;

public class GetCourierShipmentsQueryHandler
    : IRequestHandler<GetCourierShipmentsQuery, ServiceResult<IEnumerable<ShipmentDto>>>
{
    private readonly AppDbContext _context;

    public GetCourierShipmentsQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<IEnumerable<ShipmentDto>>> Handle(
        GetCourierShipmentsQuery request,
        CancellationToken cancellationToken
    )
    {
        var courier = await _context.Couriers.FirstOrDefaultAsync(
            c => c.UserId == request.CourierUserId,
            cancellationToken
        );

        if (courier == null)
            return ServiceResult<IEnumerable<ShipmentDto>>.Fail("Kurye profili bulunamadı.");

        var query = _context
            .Shipments.Include(s => s.StatusHistory)
            .Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .Include(s => s.Order)
                .ThenInclude(o => o.Items)
            .Where(s => s.CourierId == courier.Id);

        if (
            !string.IsNullOrEmpty(request.Status)
            && Enum.TryParse<ShipmentStatus>(request.Status, true, out var parsedStatus)
        )
            query = query.Where(s => s.Status == parsedStatus);

        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = shipments.Select(s => new ShipmentDto
        {
            Id = s.Id,
            OrderId = s.OrderId,
            CourierId = s.CourierId,
            Status = s.Status.ToString(),
            TrackingNumber = s.TrackingNumber,
            EstimatedDelivery = s.EstimatedDelivery,
            LabelUrl = s.LabelUrl,
            Events = s
                .StatusHistory.OrderByDescending(h => h.ChangedAt)
                .Select(h => new ShipmentStatusHistoryDto
                {
                    Status = h.Status.ToString(),
                    Note = h.Note,
                    ChangedAt = h.ChangedAt,
                })
                .ToList(),
            CreatedAt = s.CreatedAt,
        });

        return ServiceResult<IEnumerable<ShipmentDto>>.Ok(dtos);
    }
}
