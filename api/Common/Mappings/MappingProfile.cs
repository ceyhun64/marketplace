using api.Application.Queries.Offers;
using api.Application.Queries.Products;
using api.Common.DTOs;
using api.Domain.Entities;
using AutoMapper;

namespace api.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── User ─────────────────────────────────────────────────────────────
        CreateMap<User, UserDto>().ForMember(d => d.Role, o => o.MapFrom(s => s.Role.ToString()));

        // ── Category ─────────────────────────────────────────────────────────
        CreateMap<Category, CategoryDto>()
            .ForMember(
                d => d.ParentName,
                o => o.MapFrom(s => s.Parent != null ? s.Parent.Name : null)
            );

        // ── Product ───────────────────────────────────────────────────────────
        CreateMap<Product, ProductDto>()
            .ForMember(
                d => d.CategoryName,
                o => o.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty)
            )
            .ForMember(
                d => d.OfferCount,
                o => o.MapFrom(s => s.Offers != null ? s.Offers.Count : 0)
            );

        // ── ProductOffer ──────────────────────────────────────────────────────
        CreateMap<ProductOffer, OfferDto>()
            .ForMember(
                d => d.ProductName,
                o => o.MapFrom(s => s.Product != null ? s.Product.Name : string.Empty)
            )
            .ForMember(
                d => d.MerchantName,
                o => o.MapFrom(s => s.Merchant != null ? s.Merchant.StoreName : string.Empty)
            );

        // ── MerchantProfile ───────────────────────────────────────────────────
        CreateMap<MerchantProfile, MerchantDto>()
            .ForMember(
                d => d.Email,
                o => o.MapFrom(s => s.User != null ? s.User.Email : string.Empty)
            )
            .ForMember(
                d => d.IsActive,
                o => o.MapFrom(s => s.User != null ? s.User.IsVerified : false)
            );

        // ── Order ─────────────────────────────────────────────────────────────
        CreateMap<Order, OrderDto>()
            .ForMember(
                d => d.CustomerName,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.Email : string.Empty)
            )
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Source, o => o.MapFrom(s => s.Source.ToString()));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(
                d => d.ProductName,
                o =>
                    o.MapFrom(s =>
                        s.Offer != null && s.Offer.Product != null
                            ? s.Offer.Product.Name
                            : string.Empty
                    )
            );

        // ── Courier ───────────────────────────────────────────────────────────
        CreateMap<Courier, CourierDto>()
            .ForMember(
                d => d.Name,
                o => o.MapFrom(s => s.User != null ? s.User.Email : string.Empty)
            )
            .ForMember(
                d => d.Email,
                o => o.MapFrom(s => s.User != null ? s.User.Email : string.Empty)
            );
    }
}
