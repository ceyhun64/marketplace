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
    private readonly IShippingCalculatorService _shippingCalculator;
    private readonly IFulfillmentService _fulfillmentService;

    public CreateOrderCommandHandler(
        AppDbContext context,
        ICurrentUserService currentUser,
        IShippingCalculatorService shippingCalculator,
        IFulfillmentService fulfillmentService
    )
    {
        _context = context;
        _currentUser = currentUser;
        _shippingCalculator = shippingCalculator;
        _fulfillmentService = fulfillmentService;
    }

    public async Task<ServiceResult<OrderDto>> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken
    )
    {
        var dto = request.Request;

        // Teklifleri doğrula ve stok kontrolü
        var offerIds = dto.Items.Select(i => i.OfferId).ToList();
        var offers = await _context
            .ProductOffers.Include(o => o.Merchant)
            .Include(o => o.Product)
            .Where(o => offerIds.Contains(o.Id))
            .ToListAsync(cancellationToken);

        foreach (var item in dto.Items)
        {
            var offer = offers.FirstOrDefault(o => o.Id == item.OfferId);
            if (offer == null)
                return ServiceResult<OrderDto>.Fail($"Teklif bulunamadı: {item.OfferId}");
            if (offer.Stock < item.Quantity)
                return ServiceResult<OrderDto>.Fail($"Yetersiz stok: {offer.Product.Name}");
        }

        var shippingRate = Enum.Parse<ShippingRate>(dto.ShippingRate, ignoreCase: true);
        var source = Enum.Parse<OrderSource>(dto.Source, ignoreCase: true);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = _currentUser.UserId,
            Source = source,
            Status = OrderStatus.Pending,
            ShippingRate = shippingRate,
            RecipientName = dto.ShippingAddress.FullName,
            RecipientPhone = dto.ShippingAddress.Phone,
            AddressLine = dto.ShippingAddress.AddressLine,
            City = dto.ShippingAddress.City,
            District = dto.ShippingAddress.District,
            PostalCode = dto.ShippingAddress.PostalCode,
            CreatedAt = DateTime.UtcNow,
            Items = dto
                .Items.Select(i =>
                {
                    var offer = offers.First(o => o.Id == i.OfferId);
                    return new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OfferId = i.OfferId,
                        Quantity = i.Quantity,
                        UnitPrice = offer.Price,
                    };
                })
                .ToList(),
        };

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        _context.Orders.Add(order);

        // Stok düş
        foreach (var item in dto.Items)
        {
            var offer = offers.First(o => o.Id == item.OfferId);
            offer.Stock -= item.Quantity;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Shipment kaydı oluştur
        await _fulfillmentService.CreateShipmentForOrderAsync(order);

        var orderDto = new OrderDto
        {
            Id = order.Id,
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ShippingRate = order.ShippingRate.ToString(),
            CreatedAt = order.CreatedAt,
            Items = order
                .Items.Select(i => new OrderItemDto
                {
                    OfferId = i.OfferId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                })
                .ToList(),
        };

        return ServiceResult<OrderDto>.Ok(orderDto);
    }
}
