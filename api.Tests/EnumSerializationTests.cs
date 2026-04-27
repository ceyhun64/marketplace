using System.Text.RegularExpressions;
using api.Domain.Enums;
using AutoMapper;
using api.Common.Mappings;
using api.Common.DTOs;
using api.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace api.Tests;

/// <summary>
/// BUG FIX #1 — Enum Serialization Mismatch
/// Backend'in gönderdiği status değerleri frontend'in beklediği
/// UPPER_SNAKE_CASE formatında olmalı. Örn: "LabelGenerated" → "LABEL_GENERATED"
/// </summary>
public class EnumSerializationTests
{
    private readonly IMapper _mapper;

    public EnumSerializationTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();
    }

    // ── ShipmentStatus enum dönüşümleri ──────────────────────────────────────

    [Theory]
    [InlineData(ShipmentStatus.Pending,          "PENDING")]
    [InlineData(ShipmentStatus.LabelGenerated,   "LABEL_GENERATED")]
    [InlineData(ShipmentStatus.CourierAssigned,  "COURIER_ASSIGNED")]
    [InlineData(ShipmentStatus.PickedUp,         "PICKED_UP")]
    [InlineData(ShipmentStatus.InTransit,        "IN_TRANSIT")]
    [InlineData(ShipmentStatus.OutForDelivery,   "OUT_FOR_DELIVERY")]
    [InlineData(ShipmentStatus.Delivered,        "DELIVERED")]
    [InlineData(ShipmentStatus.Failed,           "FAILED")]
    public void ShipmentDto_Status_ShouldBeUpperSnakeCase(ShipmentStatus input, string expected)
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = Guid.NewGuid(),
            Status = input,
            StatusHistory = new List<ShipmentStatusHistory>(),
        };

        var dto = _mapper.Map<ShipmentDto>(shipment);

        dto.Status.Should().Be(expected,
            because: $"frontend TypeScript expects UPPER_SNAKE_CASE but received \"{dto.Status}\"");
    }

    // ── ShipmentStatusHistory dönüşümleri ────────────────────────────────────

    [Theory]
    [InlineData(ShipmentStatus.InTransit,       "IN_TRANSIT")]
    [InlineData(ShipmentStatus.OutForDelivery,  "OUT_FOR_DELIVERY")]
    public void ShipmentStatusHistoryDto_Status_ShouldBeUpperSnakeCase(
        ShipmentStatus input, string expected)
    {
        var history = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = Guid.NewGuid(),
            Status = input,
            ChangedAt = DateTime.UtcNow,
        };

        var dto = _mapper.Map<ShipmentStatusHistoryDto>(history);

        dto.Status.Should().Be(expected);
    }

    // ── OrderStatus enum dönüşümleri ─────────────────────────────────────────

    [Theory]
    [InlineData(OrderStatus.Pending,           "PENDING")]
    [InlineData(OrderStatus.PaymentConfirmed,  "PAYMENT_CONFIRMED")]
    [InlineData(OrderStatus.LabelGenerated,    "LABEL_GENERATED")]
    [InlineData(OrderStatus.CourierAssigned,   "COURIER_ASSIGNED")]
    [InlineData(OrderStatus.Delivered,         "DELIVERED")]
    [InlineData(OrderStatus.Cancelled,         "CANCELLED")]
    public void OrderDto_Status_ShouldBeUpperSnakeCase(OrderStatus input, string expected)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            Status = input,
            ShippingRate = ShippingRate.Regular,
            Items = new List<OrderItem>(),
        };

        var dto = _mapper.Map<OrderDto>(order);

        dto.Status.Should().Be(expected,
            because: $"OrderStatus comparisons in frontend will silently fail if not UPPER_SNAKE_CASE");
    }

    // ── Yardımcı: regex'in doğru çalıştığını doğrudan test et ───────────────

    [Theory]
    [InlineData("Pending",         "PENDING")]
    [InlineData("LabelGenerated",  "LABEL_GENERATED")]
    [InlineData("CourierAssigned", "COURIER_ASSIGNED")]
    [InlineData("InTransit",       "IN_TRANSIT")]
    [InlineData("OutForDelivery",  "OUT_FOR_DELIVERY")]
    public void ToUpperSnakeCase_Helper_ShouldConvertCorrectly(string input, string expected)
    {
        var result = Regex.Replace(input, "(?<=[a-z0-9])([A-Z])", "_$1").ToUpperInvariant();
        result.Should().Be(expected);
    }
}
