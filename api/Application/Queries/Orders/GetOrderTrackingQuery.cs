using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services; // ✅ Bu eksik
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
                .ThenInclude(s => s.StatusHistory)
            .Include(o => o.Shipment)
                .ThenInclude(s => s.Courier)
                    .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return ServiceResult<OrderTrackingDto>.Fail("Sipariş bulunamadı.");

        // Müşteri sadece kendi siparişini görebilir
        if (_currentUser.Role == "Customer" && order.CustomerId != _currentUser.UserId)
            return ServiceResult<OrderTrackingDto>.Fail("Bu siparişe erişim yetkiniz yok.");

        var shipment = order.Shipment;
        var tracking = new OrderTrackingDto
        {
            OrderId = order.Id,
            OrderStatus = order.Status.ToString(),
            TrackingNumber = shipment?.TrackingNumber,
            ShipmentStatus = shipment?.Status.ToString(),
            EstimatedDelivery = shipment?.EstimatedDelivery,
            LabelUrl = shipment?.LabelUrl,
            CourierName =
                shipment?.Courier?.User != null
                    ? $"{shipment.Courier.User.FirstName} {shipment.Courier.User.LastName}".Trim()
                    : null,
            CourierPhone = shipment?.Courier?.User?.Phone,
            // ✅ Yeni — ShipmentDTOs.cs'deki ShipmentStatusHistoryDto'nun alanı ChangedAt
            StatusHistory =
                shipment
                    ?.StatusHistory.OrderByDescending(h => h.ChangedAt)
                    .Select(h => new ShipmentStatusHistoryDto
                    {
                        Status = h.Status.ToString(),
                        Note = h.Note,
                        ChangedAt = h.ChangedAt,
                    })
                    .ToList()
                ?? new List<ShipmentStatusHistoryDto>(),
        };

        return ServiceResult<OrderTrackingDto>.Ok(tracking);
    }
}
