using api.Application.Commands.Orders;
using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Tests.TestHelpers;
using api.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace api.Tests.Commands;

/// <summary>
/// CreateOrderCommandHandler — price guard, enum parsing ve vendor-split testleri.
/// Stok senaryoları CreateOrderStockTests.cs dosyasında kapsamlı olarak ele alınmıştır;
/// bu dosya tamamlayıcı nitelikteki iş mantığını test eder.
/// </summary>
public class CreateOrderCommandTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<ICurrentUserService> _currentUser;
    private readonly Mock<IFulfillmentService> _fulfillment;
    private readonly Mock<IWalletService> _wallet;
    private readonly Mock<ICommissionService> _commission;
    private readonly Mock<IShippingCalculatorService> _shipping;
    private readonly Guid _customerId = Guid.NewGuid();

    public CreateOrderCommandTests()
    {
        _db = TestDbContextFactory.Create();

        _currentUser = new Mock<ICurrentUserService>();
        _currentUser.Setup(x => x.UserId).Returns(_customerId);

        _fulfillment = new Mock<IFulfillmentService>();
        _fulfillment
            .Setup(f => f.CreateShipmentForOrderAsync(It.IsAny<Order>()))
            .ReturnsAsync(new Shipment());

        _wallet = new Mock<IWalletService>();
        _wallet
            .Setup(w => w.HoldEscrowAsync(It.IsAny<VendorOrder>()))
            .Returns(Task.CompletedTask);

        _commission = new Mock<ICommissionService>();
        _commission
            .Setup(c => c.ResolveRateAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<PlanType?>()))
            .ReturnsAsync(10m); // varsayılan: %10 komisyon

        // Shipping: return 0 in tests so existing assertions on TotalAmount stay valid.
        _shipping = new Mock<IShippingCalculatorService>();
        _shipping
            .Setup(s => s.CalculateOrderShipping(It.IsAny<decimal>(), It.IsAny<ShippingRate>()))
            .Returns(0m);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Price sanity guard ($0.50 minimum)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenPriceIsBelowMinimum_ReturnsFail()
    {
        // Arrange — 0.49 < 0.50 minimum fiyat sınırının altında
        var productId = await SeedProductAsync(price: 0.49m, stock: 10);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("invalid price",
            because: "0.50 altındaki ürünler sipariş edilemez");
    }

    [Fact]
    public async Task Handle_WhenPriceIsExactlyMinimum_Succeeds()
    {
        // Arrange — sınır değer: tam 0.50
        var productId = await SeedProductAsync(price: 0.50m, stock: 10);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue(because: "0.50 minimum fiyat sınırında sipariş oluşturulabilir");
    }

    [Fact]
    public async Task Handle_WhenPriceIsAboveMinimum_Succeeds()
    {
        // Arrange
        var productId = await SeedProductAsync(price: 1.00m, stock: 5);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Enum parsing (ShippingRate ve OrderSource)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenShippingRateIsInvalid_ReturnsFail()
    {
        // Arrange
        var productId = await SeedProductAsync(price: 100m, stock: 5);
        var command = BuildCommand(productId, quantity: 1, shippingRate: "InvalidRate");

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("shipping rate");
    }

    [Fact]
    public async Task Handle_WhenOrderSourceIsInvalid_ReturnsFail()
    {
        // Arrange
        var productId = await SeedProductAsync(price: 100m, stock: 5);
        var command = BuildCommand(productId, quantity: 1, source: "UnknownSource");

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("order source");
    }

    [Theory]
    [InlineData("Regular")]
    [InlineData("Express")]
    [InlineData("regular")]  // büyük/küçük harf duyarsız
    [InlineData("express")]
    public async Task Handle_WithValidShippingRates_Succeeds(string shippingRate)
    {
        // Arrange
        var productId = await SeedProductAsync(price: 100m, stock: 5);
        var command = BuildCommand(productId, quantity: 1, shippingRate: shippingRate);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue(because: $"'{shippingRate}' geçerli bir kargo seçeneğidir");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Variant stock kontrolü
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenVariantStockIsInsufficient_ReturnsFail()
    {
        // Arrange — varyant stoğu yetersiz
        var (productId, variantId) = await SeedProductWithVariantAsync(
            productStock: 100, variantStock: 2);

        var command = BuildCommandWithVariant(productId, variantId, quantity: 5);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("stock",
            because: "Varyant stoğu yetersizse sipariş oluşturulamamalı");
    }

    [Fact]
    public async Task Handle_WhenVariantNotFoundForProduct_ReturnsFail()
    {
        // Arrange — yanlış variantId (başka ürüne ait)
        var (productId, _) = await SeedProductWithVariantAsync(productStock: 100, variantStock: 10);
        var wrongVariantId = Guid.NewGuid(); // mevcut değil

        var command = BuildCommandWithVariant(productId, wrongVariantId, quantity: 1);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Variant");
    }

    [Fact]
    public async Task Handle_WhenVariantHasSufficientStock_DeductsVariantStock()
    {
        // Arrange
        var (productId, variantId) = await SeedProductWithVariantAsync(
            productStock: 100, variantStock: 10);

        var command = BuildCommandWithVariant(productId, variantId, quantity: 3);

        // Act
        await Handle(command);

        // Assert — varyant stoğu düşmeli; ürün stoğu değişmemeli
        var variant = await _db.ProductVariants.FindAsync(variantId);
        variant!.Stock.Should().Be(7, "3 adet sipariş edildi: 10 - 3 = 7");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VendorOrder splitting & servis çağrıları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WithProductsFromTwoMerchants_CreatesTwoVendorOrders()
    {
        // Arrange — farklı iki merchant'tan ürün
        var productA = await SeedProductAsync(price: 100m, stock: 10);
        var productB = await SeedProductAsync(price: 50m, stock: 10); // farklı merchant

        var command = BuildCommandMulti((productA, 1), (productB, 2));

        // Act
        var result = await Handle(command);

        // Assert — her merchant için ayrı VendorOrder oluşturulmalı
        result.Success.Should().BeTrue();
        var vendorOrders = await _db.VendorOrders.ToListAsync();
        vendorOrders.Should().HaveCount(2,
            because: "İki farklı merchant için iki ayrı VendorOrder olmalı");
    }

    [Fact]
    public async Task Handle_WithTwoMerchants_CallsWalletHoldEscrowForEachMerchant()
    {
        // Arrange
        var productA = await SeedProductAsync(price: 100m, stock: 10);
        var productB = await SeedProductAsync(price: 50m, stock: 10);
        var command = BuildCommandMulti((productA, 1), (productB, 1));

        // Act
        await Handle(command);

        // Assert — her VendorOrder için escrow tutulmalı
        _wallet.Verify(
            w => w.HoldEscrowAsync(It.IsAny<VendorOrder>()),
            Times.Exactly(2),
            "İki merchant için iki kez escrow çağrısı yapılmalı");
    }

    [Fact]
    public async Task Handle_WithTwoMerchants_CallsCommissionServiceForEachMerchant()
    {
        // Arrange
        var productA = await SeedProductAsync(price: 100m, stock: 10);
        var productB = await SeedProductAsync(price: 50m, stock: 10);
        var command = BuildCommandMulti((productA, 1), (productB, 1));

        // Act
        await Handle(command);

        // Assert
        _commission.Verify(
            c => c.ResolveRateAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<PlanType?>()),
            Times.Exactly(2),
            "Her merchant için komisyon oranı hesaplanmalı");
    }

    [Fact]
    public async Task Handle_VendorOrderNetAmount_ReflectsCommissionDeduction()
    {
        // Arrange — %10 komisyon, 100 TL ürün
        _commission
            .Setup(c => c.ResolveRateAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<PlanType?>()))
            .ReturnsAsync(10m);

        var productId = await SeedProductAsync(price: 100m, stock: 5);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        await Handle(command);

        // Assert — subTotal=100, fee=10, netAmount=90
        var vendorOrder = await _db.VendorOrders.FirstAsync();
        vendorOrder.SubTotal.Should().Be(100m);
        vendorOrder.PlatformFee.Should().Be(10m);
        vendorOrder.MerchantNetAmount.Should().Be(90m,
            because: "NetAmount = SubTotal - PlatformFee (10%)");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private CreateOrderCommandHandler BuildHandler() =>
        new(_db, _currentUser.Object, _fulfillment.Object, _wallet.Object, _commission.Object, _shipping.Object);

    private Task<ServiceResult<OrderDto>> Handle(CreateOrderCommand command) =>
        BuildHandler().Handle(command, CancellationToken.None);

    private async Task<Guid> SeedProductAsync(decimal price, int stock)
    {
        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            StoreName = $"Store-{Guid.NewGuid():N}",
            Slug = $"store-{Guid.NewGuid():N}",
        };

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchant.Id,
            Merchant = merchant,
            Name = "Test Ürünü",
            Price = price,
            Stock = stock,
            IsApproved = true,
            Images = new List<string>(),
            CategoryId = Guid.NewGuid(),
        };

        _db.MerchantProfiles.Add(merchant);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product.Id;
    }

    private async Task<(Guid productId, Guid variantId)> SeedProductWithVariantAsync(
        int productStock, int variantStock)
    {
        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            StoreName = $"Store-{Guid.NewGuid():N}",
            Slug = $"store-{Guid.NewGuid():N}",
        };

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchant.Id,
            Merchant = merchant,
            Name = "Varyantlı Ürün",
            Price = 100m,
            Stock = productStock,
            IsApproved = true,
            Images = new List<string>(),
            CategoryId = Guid.NewGuid(),
        };

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Stock = variantStock,
            IsActive = true,
        };

        _db.MerchantProfiles.Add(merchant);
        _db.Products.Add(product);
        _db.ProductVariants.Add(variant);
        await _db.SaveChangesAsync();
        return (product.Id, variant.Id);
    }

    private static CreateOrderCommand BuildCommand(
        Guid productId,
        int quantity,
        string shippingRate = "Regular",
        string source = "Marketplace") =>
        new(new CreateOrderDto
        {
            Items = new List<CreateOrderItemDto>
            {
                new() { ProductId = productId, Quantity = quantity },
            },
            ShippingRate = shippingRate,
            Source = source,
            ShippingAddress = SampleAddress(),
        });

    private static CreateOrderCommand BuildCommandWithVariant(
        Guid productId, Guid variantId, int quantity) =>
        new(new CreateOrderDto
        {
            Items = new List<CreateOrderItemDto>
            {
                new() { ProductId = productId, VariantId = variantId, Quantity = quantity },
            },
            ShippingRate = "Regular",
            Source = "Marketplace",
            ShippingAddress = SampleAddress(),
        });

    private static CreateOrderCommand BuildCommandMulti(
        params (Guid productId, int quantity)[] items) =>
        new(new CreateOrderDto
        {
            Items = items
                .Select(i => new CreateOrderItemDto
                {
                    ProductId = i.productId,
                    Quantity = i.quantity,
                })
                .ToList(),
            ShippingRate = "Regular",
            Source = "Marketplace",
            ShippingAddress = SampleAddress(),
        });

    private static ShippingAddressDto SampleAddress() => new()
    {
        FullName = "Ali Veli",
        Phone = "555-000-0000",
        AddressLine = "Test Cad. No:1",
        City = "Istanbul",
        District = "Kadıköy",
        PostalCode = "34710",
    };

    public void Dispose() => _db.Dispose();
}
