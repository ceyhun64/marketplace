using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Orders;

public record GetOrderTrackingQuery(Guid OrderId) : IRequest<ServiceResult<OrderTrackingDto>>;

public class GetOrderTrackingQueryHandler
    : IRequestHandler<GetOrderTrackingQuery, ServiceResult<OrderTrackingDto>>
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetOrderTrackingQueryHandler(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<OrderTrackingDto>> Handle(
        GetOrderTrackingQuery request,
        CancellationToken cancellationToken
    )
    {
        var order = await _context
            .Orders.Include(o => o.Shipment)
                .ThenInclude(s => s!.StatusHistory) // ← s! ekle
            .Include(o => o.Shipment)
                .ThenInclude(s => s!.Courier) // ← s! ekle
                    .ThenInclude(c => c!.User) // ← c! ekle
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return ServiceResult<OrderTrackingDto>.Fail("Sipariş bulunamadı.");

        if (_currentUser.Role == "Customer" && order.CustomerId != _currentUser.UserId)
            return ServiceResult<OrderTrackingDto>.Fail("Erişim yetkiniz yok.");

        var s = order.Shipment;

        return ServiceResult<OrderTrackingDto>.Ok(
            new OrderTrackingDto
            {
                OrderId = order.Id,
                OrderStatus = order.Status.ToString(),
                TrackingNumber = s?.TrackingNumber,
                ShipmentStatus = s?.Status.ToString(),
                EstimatedDelivery = s?.EstimatedDelivery,
                LabelUrl = s?.LabelUrl,
                CourierName =
                    s?.Courier?.User != null
                        ? $"{s.Courier.User.FirstName} {s.Courier.User.LastName}".Trim()
                        : null,
                CourierPhone = s?.Courier?.User?.Phone,
                StatusHistory =
                    s?.StatusHistory.OrderByDescending(h => h.ChangedAt)
                        .Select(h => new ShipmentStatusHistoryDto
                        {
                            Status = h.Status.ToString(),
                            Note = h.Note,
                            ChangedAt = h.ChangedAt,
                        })
                        .ToList()
                    ?? new(),
            }
        );
    }
}
