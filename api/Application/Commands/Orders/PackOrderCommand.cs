using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Orders;

public record PackOrderCommand(Guid OrderId, Guid MerchantUserId)
    : IRequest<ServiceResult<OrderDto>>;

public class PackOrderCommandHandler : IRequestHandler<PackOrderCommand, ServiceResult<OrderDto>>
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public PackOrderCommandHandler(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ServiceResult<OrderDto>> Handle(
        PackOrderCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _context.MerchantProfiles.FirstOrDefaultAsync(
            m => m.UserId == request.MerchantUserId,
            cancellationToken
        );
        if (merchant == null)
            return ServiceResult<OrderDto>.Fail("Merchant profili bulunamadı.");

        var order = await _context
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(
                o => o.Id == request.OrderId && o.Items.Any(i => i.MerchantId == merchant.Id),
                cancellationToken
            );

        if (order == null)
            return ServiceResult<OrderDto>.Fail("Sipariş bulunamadı veya yetkiniz yok.");

        if (order.Status != OrderStatus.PaymentConfirmed && order.Status != OrderStatus.Pending)
            return ServiceResult<OrderDto>.Fail(
                $"Bu sipariş hazırlanamaz. Mevcut durum: {order.Status}"
            );

        order.Status = OrderStatus.LabelGenerated; // Merchant packed → label bekleniyor
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _ = _notificationService.SendOrderStatusNotificationAsync(
            order.Id,
            "Siparişiniz hazırlandı, kurye bekleniyor."
        );

        return ServiceResult<OrderDto>.Ok(MapToDto(order));
    }

    private static OrderDto MapToDto(api.Domain.Entities.Order o) =>
        new()
        {
            Id = o.Id,
            Status = o.Status.ToString(),
            TotalAmount = o.TotalAmount,
            ShippingRate = o.ShippingRate.ToString(),
            Source = o.Source.ToString(),
            CreatedAt = o.CreatedAt,
            Items = o
                .Items.Select(i => new OrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    SubTotal = i.LineTotal, // OrderItem.LineTotal (computed) → DTO.SubTotal
                })
                .ToList(),
        };
}
