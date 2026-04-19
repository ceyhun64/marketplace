using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Orders;

public record UpdateOrderStatusCommand(Guid OrderId, string NewStatus)
    : IRequest<ServiceResult<OrderDto>>;

public class UpdateOrderStatusCommandHandler
    : IRequestHandler<UpdateOrderStatusCommand, ServiceResult<OrderDto>>
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public UpdateOrderStatusCommandHandler(
        AppDbContext context,
        INotificationService notificationService
    )
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ServiceResult<OrderDto>> Handle(
        UpdateOrderStatusCommand request,
        CancellationToken cancellationToken
    )
    {
        if (!Enum.TryParse<OrderStatus>(request.NewStatus, ignoreCase: true, out var newStatus))
            return ServiceResult<OrderDto>.Fail($"Geçersiz sipariş durumu: {request.NewStatus}");

        var order = await _context
            .Orders.Include(o => o.Items)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return ServiceResult<OrderDto>.Fail("Sipariş bulunamadı.");

        // Geçersiz durum geçişlerini engelle
        var invalidTransitions = new Dictionary<OrderStatus, List<OrderStatus>>
        {
            {
                OrderStatus.Delivered,
                new List<OrderStatus> { OrderStatus.Pending, OrderStatus.PaymentConfirmed }
            },
            {
                OrderStatus.Cancelled,
                new List<OrderStatus> { OrderStatus.Delivered, OrderStatus.InTransit }
            },
        };

        if (
            invalidTransitions.TryGetValue(order.Status, out var blocked)
            && blocked.Contains(newStatus)
        )
            return ServiceResult<OrderDto>.Fail(
                $"'{order.Status}' durumundan '{newStatus}' durumuna geçiş yapılamaz."
            );

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await _notificationService.SendOrderStatusNotificationAsync(order.Id, newStatus.ToString());

        return ServiceResult<OrderDto>.Ok(
            new OrderDto
            {
                Id = order.Id,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                ShippingRate = order.ShippingRate.ToString(),
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
            }
        );
    }
}
