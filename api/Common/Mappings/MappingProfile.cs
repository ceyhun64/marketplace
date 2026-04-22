using api.Common.DTOs;
using api.Domain.Entities;
using AutoMapper;

namespace api.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<MerchantProfile, MerchantDto>()
            .ForMember(d => d.Email, o => o.MapFrom(s => s.User != null ? s.User.Email : null));

        CreateMap<Product, ProductDto>()
            .ForMember(
                d => d.CategoryName,
                o => o.MapFrom(s => s.Category != null ? s.Category.Name : null)
            )
            .ForMember(
                d => d.MerchantStoreName,
                o => o.MapFrom(s => s.Merchant != null ? s.Merchant.StoreName : null)
            );

        CreateMap<Category, CategoryDto>();

        CreateMap<Order, OrderDto>();

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.ProductName));

        CreateMap<Shipment, ShipmentDto>()
            .ForMember(
                d => d.CourierName,
                o =>
                    o.MapFrom(s =>
                        s.Courier != null && s.Courier.User != null
                            ? $"{s.Courier.User.FirstName} {s.Courier.User.LastName}".Trim()
                            : null
                    )
            );

        CreateMap<ShipmentStatusHistory, ShipmentStatusHistoryDto>()
            .ForMember(d => d.ChangedAt, o => o.MapFrom(s => s.ChangedAt));

        CreateMap<Courier, CourierDto>()
            .ForMember(d => d.Email, o => o.MapFrom(s => s.User != null ? s.User.Email : null));

        CreateMap<Subscription, SubscriptionDto>();
    }
}
