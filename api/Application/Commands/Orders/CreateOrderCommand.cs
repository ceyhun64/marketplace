using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Orders;

public record CreateOrderCommand(CreateOrderDto Request) : IRequest<ServiceResult<OrderDto>>;

public class CreateOrderCommandHandler
    : IRequestHandler<CreateOrderCommand, ServiceResult<OrderDto>>
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFulfillmentService _fulfillmentService;

    public CreateOrderCommandHandler(
        AppDbContext context,
        ICurrentUserService currentUser,
        IFulfillmentService fulfillmentService
    )
    {
        _context = context;
        _currentUser = currentUser;
        _fulfillmentService = fulfillmentService;
    }

    public async Task<ServiceResult<OrderDto>> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken
    )
    {
        var dto = request.Request;
        var productIds = dto.Items.Select(i => i.ProductId).ToList();

        var products = await _context
            .Products.Include(p => p.Merchant)
            .Where(p => productIds.Contains(p.Id) && !p.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var item in dto.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product == null)
                return ServiceResult<OrderDto>.Fail($"Ürün bulunamadı: {item.ProductId}");
            if (product.Stock < item.Quantity)
                return ServiceResult<OrderDto>.Fail($"Yetersiz stok: {product.Name}");
        }

        var shippingRate = Enum.Parse<ShippingRate>(dto.ShippingRate, ignoreCase: true);
        var source = Enum.Parse<OrderSource>(dto.Source, ignoreCase: true);

        var orderItems = dto
            .Items.Select(i =>
            {
                var product = products.First(p => p.Id == i.ProductId);
                return new OrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    MerchantId = product.MerchantId,
                    ProductName = product.Name,
                    ProductImage = product.Images.FirstOrDefault(),
                    UnitPrice = product.Price,
                    Quantity = i.Quantity,
                };
            })
            .ToList();

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = _currentUser.UserId,
            Source = source,
            Status = OrderStatus.Pending,
            ShippingRate = shippingRate,
            TotalAmount = orderItems.Sum(i => i.UnitPrice * i.Quantity),
            RecipientName = dto.ShippingAddress.FullName,
            RecipientPhone = dto.ShippingAddress.Phone,
            AddressLine = dto.ShippingAddress.AddressLine,
            City = dto.ShippingAddress.City,
            District = dto.ShippingAddress.District,
            PostalCode = dto.ShippingAddress.PostalCode,
            Items = orderItems,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.Orders.Add(order);

        // Stok düş
        foreach (var item in dto.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);
            product.Stock -= item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await _fulfillmentService.CreateShipmentForOrderAsync(order);

        return ServiceResult<OrderDto>.Ok(
            new OrderDto
            {
                Id = order.Id,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                ShippingRate = order.ShippingRate.ToString(),
                CreatedAt = order.CreatedAt,
                Items = orderItems
                    .Select(i => new OrderItemDto
                    {
                        ProductId = i.ProductId,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                    })
                    .ToList(),
            }
        );
    }
}
