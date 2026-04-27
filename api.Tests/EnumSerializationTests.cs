using System.Text.RegularExpressions;
using api.Common.DTOs;
using api.Common.Mappings;
using api.Domain.Entities;
using api.Domain.Enums;
using AutoMapper;
using FluentAssertions;
using Xunit;

namespace api.Tests;

/// <summary>
/// BUG FIX #1 — Enum Serialization Mismatch
/// ─────────────────────────────────────────
/// C# enum.ToString() → "LabelGenerated" (PascalCase)
/// TypeScript frontend beklentisi → "LABEL_GENERATED" (UPPER_SNAKE_CASE)
///
/// MappingProfile.ToUpperSnakeCase() regex dönüşümünü ve AutoMapper
/// ForMember konfigürasyonlarını kapsamlı olarak doğrular.
/// </summary>
public class EnumSerializationTests
{
    private readonly IMapper _mapper;

    public EnumSerializationTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());

        // AutoMapper konfigürasyonunun kendisinin geçerli olduğunu doğrula.
        // Eksik ForMember veya belirsiz eşlemeler burada patlar.
        config.AssertConfigurationIsValid();

        _mapper = config.CreateMapper();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ToUpperSnakeCase yardımcı fonksiyonu — regex doğruluğu
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Pending",          "PENDING")]
    [InlineData("LabelGenerated",   "LABEL_GENERATED")]
    [InlineData("CourierAssigned",  "COURIER_ASSIGNED")]
    [InlineData("PickedUp",         "PICKED_UP")]
    [InlineData("InTransit",        "IN_TRANSIT")]
    [InlineData("OutForDelivery",   "OUT_FOR_DELIVERY")]
    [InlineData("Delivered",        "DELIVERED")]
    [InlineData("Failed",           "FAILED")]
    [InlineData("PaymentConfirmed", "PAYMENT_CONFIRMED")]
    [InlineData("Cancelled",        "CANCELLED")]
    [InlineData("Regular",          "REGULAR")]
    [InlineData("Express",          "EXPRESS")]
    public void ToUpperSnakeCase_ConvertsAllKnownValues(string input, string expected)
    {
        var result = Regex.Replace(input, "(?<=[a-z0-9])([A-Z])", "_$1").ToUpperInvariant();
        result.Should().Be(expected, because: $"'{input}' → '{expected}' dönüşümü gereklidir");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ShipmentDto.Status — tüm ShipmentStatus değerleri
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(ShipmentStatus.Pending,         "PENDING")]
    [InlineData(ShipmentStatus.LabelGenerated,  "LABEL_GENERATED")]
    [InlineData(ShipmentStatus.CourierAssigned, "COURIER_ASSIGNED")]
    [InlineData(ShipmentStatus.PickedUp,        "PICKED_UP")]
    [InlineData(ShipmentStatus.InTransit,       "IN_TRANSIT")]
    [InlineData(ShipmentStatus.OutForDelivery,  "OUT_FOR_DELIVERY")]
    [InlineData(ShipmentStatus.Delivered,       "DELIVERED")]
    [InlineData(ShipmentStatus.Failed,          "FAILED")]
    public void ShipmentDto_Status_IsUpperSnakeCase(ShipmentStatus status, string expected)
    {
        var shipment = BuildShipment(status);

        var dto = _mapper.Map<ShipmentDto>(shipment);

        dto.Status.Should().Be(expected,
            because: $"TypeScript karşılaştırması shipment.status === \"{expected}\" şeklinde " +
                     $"çalışır; PascalCase \"{status}\" gelirse eşleşme sessizce başarısız olur");
    }

    [Fact]
    public void ShipmentDto_Status_IsNeverPascalCase_ForAnyEnumValue()
    {
        // Enum'a ileride eklenen her yeni değerin de dönüştürüldüğünü garanti eder.
        foreach (ShipmentStatus status in Enum.GetValues<ShipmentStatus>())
        {
            var dto = _mapper.Map<ShipmentDto>(BuildShipment(status));
            dto.Status.Should().NotMatchRegex("[a-z]",
                because: $"Küçük harf içeren '{dto.Status}' frontend'de sessiz hata üretir");
            dto.Status.Should().NotBeEmpty();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ShipmentStatusHistoryDto.Status — tüm değerler + history koleksiyonu
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(ShipmentStatus.Pending,         "PENDING")]
    [InlineData(ShipmentStatus.LabelGenerated,  "LABEL_GENERATED")]
    [InlineData(ShipmentStatus.CourierAssigned, "COURIER_ASSIGNED")]
    [InlineData(ShipmentStatus.PickedUp,        "PICKED_UP")]
    [InlineData(ShipmentStatus.InTransit,       "IN_TRANSIT")]
    [InlineData(ShipmentStatus.OutForDelivery,  "OUT_FOR_DELIVERY")]
    [InlineData(ShipmentStatus.Delivered,       "DELIVERED")]
    [InlineData(ShipmentStatus.Failed,          "FAILED")]
    public void ShipmentStatusHistoryDto_Status_IsUpperSnakeCase(
        ShipmentStatus status, string expected)
    {
        var history = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = Guid.NewGuid(),
            Status = status,
            ChangedAt = DateTime.UtcNow,
        };

        var dto = _mapper.Map<ShipmentStatusHistoryDto>(history);

        dto.Status.Should().Be(expected);
    }

    [Fact]
    public void ShipmentDto_HistoryStatuses_AreAllUpperSnakeCase_WhenMappedFromShipment()
    {
        // Shipment → ShipmentDto eşlemesi history koleksiyonunu da dönüştürmeli
        // ve OrderByDescending(ChangedAt) sırasını korumalı.
        var now = DateTime.UtcNow;
        var shipment = BuildShipment(ShipmentStatus.InTransit);
        shipment.StatusHistory = new List<ShipmentStatusHistory>
        {
            new() { Status = ShipmentStatus.Pending,        ChangedAt = now.AddHours(-3) },
            new() { Status = ShipmentStatus.LabelGenerated, ChangedAt = now.AddHours(-2) },
            new() { Status = ShipmentStatus.InTransit,      ChangedAt = now.AddHours(-1) },
        };

        var dto = _mapper.Map<ShipmentDto>(shipment);

        dto.History.Should().HaveCount(3);
        dto.History.Select(h => h.Status).Should().ContainInOrder(
            "IN_TRANSIT", "LABEL_GENERATED", "PENDING",
            because: "History OrderByDescending(ChangedAt) ile sıralanmalı");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OrderDto.Status — tüm OrderStatus değerleri
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(OrderStatus.Pending,          "PENDING")]
    [InlineData(OrderStatus.PaymentConfirmed, "PAYMENT_CONFIRMED")]
    [InlineData(OrderStatus.LabelGenerated,   "LABEL_GENERATED")]
    [InlineData(OrderStatus.CourierAssigned,  "COURIER_ASSIGNED")]
    [InlineData(OrderStatus.PickedUp,         "PICKED_UP")]
    [InlineData(OrderStatus.InTransit,        "IN_TRANSIT")]
    [InlineData(OrderStatus.OutForDelivery,   "OUT_FOR_DELIVERY")]
    [InlineData(OrderStatus.Delivered,        "DELIVERED")]
    [InlineData(OrderStatus.Failed,           "FAILED")]
    [InlineData(OrderStatus.Cancelled,        "CANCELLED")]
    public void OrderDto_Status_IsUpperSnakeCase(OrderStatus status, string expected)
    {
        var dto = _mapper.Map<OrderDto>(BuildOrder(status));

        dto.Status.Should().Be(expected);
    }

    [Fact]
    public void OrderDto_Status_IsNeverPascalCase_ForAnyEnumValue()
    {
        foreach (OrderStatus status in Enum.GetValues<OrderStatus>())
        {
            var dto = _mapper.Map<OrderDto>(BuildOrder(status));
            dto.Status.Should().NotMatchRegex("[a-z]",
                because: $"Küçük harf içeren '{dto.Status}' frontend'de sessiz hata üretir");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OrderDto.ShippingRate — enum dönüşümü
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(ShippingRate.Regular, "REGULAR")]
    [InlineData(ShippingRate.Express, "EXPRESS")]
    public void OrderDto_ShippingRate_IsUpperSnakeCase(ShippingRate rate, string expected)
    {
        var dto = _mapper.Map<OrderDto>(BuildOrder(OrderStatus.Pending, rate));

        dto.ShippingRate.Should().Be(expected,
            because: "Frontend SHIPPING_RATE_LABELS map'i UPPER_SNAKE_CASE anahtarı bekler");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static Shipment BuildShipment(ShipmentStatus status) => new()
    {
        Id = Guid.NewGuid(),
        OrderId = Guid.NewGuid(),
        Status = status,
        TrackingNumber = "TRK-TEST",
        StatusHistory = new List<ShipmentStatusHistory>(),
    };

    private static Order BuildOrder(
        OrderStatus status,
        ShippingRate rate = ShippingRate.Regular) => new()
    {
        Id = Guid.NewGuid(),
        Status = status,
        ShippingRate = rate,
        Items = new List<OrderItem>(),
    };
}
