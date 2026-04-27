using api.Common.DTOs;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// CreateOrderValidator, ShippingAddressValidator, UpdateOrderStatusValidator
/// FluentValidation kural doğrulamaları.
/// </summary>
public class OrderValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // CreateOrderValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreateOrderValidator _orderValidator = new();

    private static CreateOrderDto ValidOrder(
        string shippingRate = "REGULAR",
        string source = "MARKETPLACE"
    ) =>
        new()
        {
            Items = new List<CreateOrderItemDto>
            {
                new() { ProductId = Guid.NewGuid(), Quantity = 2 },
            },
            ShippingRate = shippingRate,
            Source = source,
            ShippingAddress = ValidAddress(),
        };

    private static ShippingAddressDto ValidAddress() =>
        new()
        {
            FullName = "Ali Veli",
            Phone = "05321234567",
            AddressLine = "Atatürk Cad. No: 42",
            City = "İstanbul",
            District = "Kadıköy",
            PostalCode = "34710",
        };

    [Fact]
    public void Order_WithValidData_PassesValidation()
    {
        var result = _orderValidator.Validate(ValidOrder());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Order_WithEmptyItems_FailsValidation()
    {
        var dto = ValidOrder();
        dto.Items = new List<CreateOrderItemDto>();
        var result = _orderValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Items");
    }

    [Fact]
    public void Order_WithMoreThan50Items_FailsValidation()
    {
        var dto = ValidOrder();
        dto.Items = Enumerable
            .Range(0, 51)
            .Select(_ => new CreateOrderItemDto { ProductId = Guid.NewGuid(), Quantity = 1 })
            .ToList();
        var result = _orderValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("EXPRESS")]
    [InlineData("REGULAR")]
    public void Order_WithValidShippingRate_PassesValidation(string rate)
    {
        var result = _orderValidator.Validate(ValidOrder(shippingRate: rate));
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("Standard")]
    [InlineData("")]
    [InlineData("express")] // küçük harf — geçersiz
    public void Order_WithInvalidShippingRate_FailsValidation(string rate)
    {
        var result = _orderValidator.Validate(ValidOrder(shippingRate: rate));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ShippingRate");
    }

    [Theory]
    [InlineData("MARKETPLACE")]
    [InlineData("ESTORE")]
    public void Order_WithValidSource_PassesValidation(string source)
    {
        var result = _orderValidator.Validate(ValidOrder(source: source));
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("Marketplace")]
    [InlineData("")]
    [InlineData("WEB")]
    public void Order_WithInvalidSource_FailsValidation(string source)
    {
        var result = _orderValidator.Validate(ValidOrder(source: source));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Source");
    }

    // ── OrderItem validation ──────────────────────────────────────────────────

    [Fact]
    public void OrderItem_WithZeroQuantity_FailsValidation()
    {
        var dto = ValidOrder();
        dto.Items = new List<CreateOrderItemDto>
        {
            new() { ProductId = Guid.NewGuid(), Quantity = 0 },
        };
        var result = _orderValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void OrderItem_WithQuantity1000_FailsValidation()
    {
        var dto = ValidOrder();
        dto.Items = new List<CreateOrderItemDto>
        {
            new() { ProductId = Guid.NewGuid(), Quantity = 1000 },
        };
        var result = _orderValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void OrderItem_WithQuantity999_PassesValidation()
    {
        var dto = ValidOrder();
        dto.Items = new List<CreateOrderItemDto>
        {
            new() { ProductId = Guid.NewGuid(), Quantity = 999 },
        };
        var result = _orderValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void OrderItem_WithEmptyProductId_FailsValidation()
    {
        var dto = ValidOrder();
        dto.Items = new List<CreateOrderItemDto>
        {
            new() { ProductId = Guid.Empty, Quantity = 1 },
        };
        var result = _orderValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ShippingAddressValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly ShippingAddressValidator _addressValidator = new();

    [Fact]
    public void Address_WithValidData_PassesValidation()
    {
        var result = _addressValidator.Validate(ValidAddress());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Address_WithEmptyFullName_FailsValidation()
    {
        var address = ValidAddress() with { FullName = "" };
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FullName");
    }

    [Fact]
    public void Address_WithFullNameOver100Chars_FailsValidation()
    {
        var address = ValidAddress() with { FullName = new string('A', 101) };
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("05321234567")] // geçerli
    [InlineData("+905321234567")] // geçerli uluslararası format
    public void Address_WithValidPhone_PassesValidation(string phone)
    {
        var address = ValidAddress() with { Phone = phone };
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")] // 5 basamak — geçersiz
    [InlineData("abcdefghijk")] // harf içeriyor
    public void Address_WithInvalidPhone_FailsValidation(string phone)
    {
        var address = ValidAddress() with { Phone = phone };
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Phone");
    }

    [Fact]
    public void Address_WithPostalCodeNot5Digits_FailsValidation()
    {
        var address = ValidAddress() with { PostalCode = "3471" }; // 4 basamak
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PostalCode");
    }

    [Fact]
    public void Address_WithLetterInPostalCode_FailsValidation()
    {
        var address = ValidAddress() with { PostalCode = "3471A" };
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Address_WithAddressLineOver250Chars_FailsValidation()
    {
        var address = ValidAddress() with { AddressLine = new string('X', 251) };
        var result = _addressValidator.Validate(address);
        result.IsValid.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateOrderStatusValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateOrderStatusValidator _statusValidator = new();

    [Theory]
    [InlineData("PENDING")]
    [InlineData("PAYMENT_CONFIRMED")]
    [InlineData("LABEL_GENERATED")]
    [InlineData("COURIER_ASSIGNED")]
    [InlineData("PICKED_UP")]
    [InlineData("IN_TRANSIT")]
    [InlineData("OUT_FOR_DELIVERY")]
    [InlineData("DELIVERED")]
    [InlineData("CANCELLED")]
    [InlineData("FAILED")]
    public void UpdateOrderStatus_WithValidStatus_PassesValidation(string status)
    {
        var dto = new UpdateOrderStatusDto { Status = status };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeTrue(because: $"'{status}' geçerli bir order durumudur");
    }

    [Theory]
    [InlineData("Pending")] // PascalCase — geçersiz
    [InlineData("pending")] // küçük harf — geçersiz
    [InlineData("UNKNOWN_STATUS")]
    [InlineData("")]
    public void UpdateOrderStatus_WithInvalidStatus_FailsValidation(string status)
    {
        var dto = new UpdateOrderStatusDto { Status = status };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeFalse(because: $"'{status}' geçersiz bir status değeridir");
    }
}
