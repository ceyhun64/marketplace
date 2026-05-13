using System.Text.RegularExpressions;
using api.Common.DTOs;
using api.Domain.Entities;
using AutoMapper;

namespace api.Common.Mappings;

public class MappingProfile : Profile
{
    // PascalCase → UPPER_SNAKE_CASE: "LabelGenerated" → "LABEL_GENERATED"
    private static string ToUpperSnakeCase(string value) =>
        Regex.Replace(value, "(?<=[a-z0-9])([A-Z])", "_$1").ToUpperInvariant();

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

        CreateMap<Order, OrderDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => ToUpperSnakeCase(s.Status.ToString())))
            .ForMember(d => d.ShippingRate, o => o.MapFrom(s => ToUpperSnakeCase(s.ShippingRate.ToString())));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.ProductName));

        CreateMap<Shipment, ShipmentDto>()
            .ForMember(
                d => d.Status,
                o => o.MapFrom(s => ToUpperSnakeCase(s.Status.ToString()))
            )
            .ForMember(
                d => d.CourierName,
                o =>
                    o.MapFrom(s =>
                        s.Courier != null && s.Courier.User != null
                            ? $"{s.Courier.User.FirstName} {s.Courier.User.LastName}".Trim()
                            : null
                    )
            )
            .ForMember(
                d => d.Events,
                o => o.MapFrom(s => s.StatusHistory.OrderByDescending(h => h.ChangedAt))
            )
            .ForMember(d => d.UpdatedAt, o => o.MapFrom(s => s.UpdatedAt));

        CreateMap<ShipmentStatusHistory, ShipmentStatusHistoryDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => ToUpperSnakeCase(s.Status.ToString())))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.ChangedAt))
            .ForMember(d => d.ChangedAt, o => o.MapFrom(s => s.ChangedAt));

        CreateMap<Courier, CourierDto>()
            .ForMember(d => d.Email, o => o.MapFrom(s => s.User != null ? s.User.Email : null))
            .ForMember(d => d.FullName, o => o.MapFrom(s => s.User != null ? $"{s.User.FirstName} {s.User.LastName}".Trim() : string.Empty))
            .ForMember(d => d.Name, o => o.MapFrom(s => s.User != null ? $"{s.User.FirstName} {s.User.LastName}".Trim() : string.Empty))
            .ForMember(d => d.Phone, o => o.MapFrom(s => s.User != null ? s.User.Phone : null))
            .ForMember(d => d.PhoneNumber, o => o.MapFrom(s => s.User != null ? s.User.Phone : null))
            .ForMember(d => d.VehiclePlate, o => o.MapFrom(s => s.PlateNumber))
            .ForMember(d => d.CurrentLat, o => o.MapFrom(s => s.CurrentLatitude))
            .ForMember(d => d.CurrentLng, o => o.MapFrom(s => s.CurrentLongitude))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.User != null ? s.User.CreatedAt : s.CreatedAt));

        CreateMap<Subscription, SubscriptionDto>();

        // ── Plugin & MerchantPlugin maplar ───────────────────────────────────

        CreateMap<Plugin, PluginDto>()
            .ForMember(d => d.MinimumPlan, o => o.MapFrom(s => s.MinimumPlan.ToString()))
            .ForMember(d => d.IsSubscribed, o => o.Ignore()); // caller sets per-merchant flag

        CreateMap<MerchantPlugin, MerchantPluginDto>()
            .ForMember(
                d => d.PluginName,
                o => o.MapFrom(s => s.Plugin != null ? s.Plugin.Name : string.Empty)
            )
            .ForMember(
                d => d.PluginSlug,
                o => o.MapFrom(s => s.Plugin != null ? s.Plugin.Slug : string.Empty)
            )
            .ForMember(
                d => d.PluginIconUrl,
                o => o.MapFrom(s => s.Plugin != null ? s.Plugin.IconUrl : null)
            );

        // ── Milestone 2: Fulfillment ek maplar ───────────────────────────────

        CreateMap<Courier, CourierAssignmentSummaryDto>()
            .ForMember(
                d => d.CourierName,
                o =>
                    o.MapFrom(s =>
                        s.User != null
                            ? $"{s.User.FirstName} {s.User.LastName}".Trim()
                            : string.Empty
                    )
            )
            .ForMember(
                d => d.ActiveShipmentCount,
                o =>
                    o.MapFrom(s =>
                        s.Shipments.Count(sh =>
                            sh.Status != Domain.Enums.ShipmentStatus.Delivered
                            && sh.Status != Domain.Enums.ShipmentStatus.Failed
                        )
                    )
            );
    }
}
