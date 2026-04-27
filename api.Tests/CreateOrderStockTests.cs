using api.Application.Commands.Orders;
using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using api.Infrastructure.Services;

namespace api.Tests;

/// <summary>
/// BUG FIX #3 — Race Condition on Stock Decrement
/// Serializable transaction ile aynı anda gelen iki sipariş için
/// stok tutarlılığı garanti edilmeli.
/// InMemory DB transaction'ı tam desteklemediğinden burada
/// mantıksal doğrulukları test ediyoruz; entegrasyon testi
/// gerçek Postgres üzerinde çalıştırılmalı.
/// </summary>
public class CreateOrderStockTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<ICurrentUserService> _currentUser;
    private readonly Mock<IFulfillmentService> _fulfillment;

    public CreateOrderStockTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _currentUser = new Mock<ICurrentUserService>();
        _currentUser.Setup(x => x.UserId).Returns(Guid.NewGuid());

        _fulfillment = new Mock<IFulfillmentService>();
        _fulfillment
            .Setup(x => x.CreateShipmentForOrderAsync(It.IsAny<Order>()))
            .Returns(Task.CompletedTask);
    }

    private CreateOrderCommandHandler BuildHandler() =>
        new(_db, _currentUser.Object, _fulfillment.Object);

    private async Task<Guid> SeedProductAsync(int stock, decimal price = 100m)
    {
        var merchant = new MerchantProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), StoreName = "Test" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchant.Id,
            Merchant = merchant,
            Name = "Test Ürün",
            Price = price,
            Stock = stock,
            IsApproved = true,
            Images = new List<string>(),
        };
        _db.MerchantProfiles.Add(merchant);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product.Id;
    }

    [Fact]
    public async Task CreateOrder_WithSufficientStock_ShouldSucceed()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 10);
        var command = new CreateOrderCommand(new CreateOrderDto
        {
            Items = new List<OrderItemRequest> { new() { ProductId = productId, Quantity = 3 } },
            ShippingRate = "Regular",
            Source = "Web",
            ShippingAddress = new ShippingAddressDto
            {
                FullName = "Test User", Phone = "555-0000",
                AddressLine = "Test St", City = "Istanbul",
                District = "Kadikoy", PostalCode = "34710"
            }
        });

        // Act
        var result = await BuildHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var product = await _db.Products.FindAsync(productId);
        product!.Stock.Should().Be(7, "10 - 3 = 7 olmalı");
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_ShouldFail()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 2);
        var command = new CreateOrderCommand(new CreateOrderDto
        {
            Items = new List<OrderItemRequest> { new() { ProductId = productId, Quantity = 5 } },
            ShippingRate = "Regular",
            Source = "Web",
            ShippingAddress = new ShippingAddressDto
            {
                FullName = "Test", Phone = "555", AddressLine = "A", City = "B", District = "C", PostalCode = "D"
            }
        });

        // Act
        var result = await BuildHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Yetersiz stok");

        // Stok değişmemeli
        var product = await _db.Products.FindAsync(productId);
        product!.Stock.Should().Be(2, "başarısız sipariş stok düşürmemeli");
    }

    [Fact]
    public async Task CreateOrder_WithNonExistentProduct_ShouldFail()
    {
        // Arrange
        var command = new CreateOrderCommand(new CreateOrderDto
        {
            Items = new List<OrderItemRequest> { new() { ProductId = Guid.NewGuid(), Quantity = 1 } },
            ShippingRate = "Regular",
            Source = "Web",
            ShippingAddress = new ShippingAddressDto
            {
                FullName = "Test", Phone = "555", AddressLine = "A", City = "B", District = "C", PostalCode = "D"
            }
        });

        // Act
        var result = await BuildHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Ürün bulunamadı");
    }

    [Fact]
    public async Task CreateOrder_ShouldSetStatusToPending()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 5);
        var command = new CreateOrderCommand(new CreateOrderDto
        {
            Items = new List<OrderItemRequest> { new() { ProductId = productId, Quantity = 1 } },
            ShippingRate = "Express",
            Source = "Mobile",
            ShippingAddress = new ShippingAddressDto
            {
                FullName = "Test", Phone = "555", AddressLine = "A", City = "B", District = "C", PostalCode = "D"
            }
        });

        // Act
        var result = await BuildHandler().Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        // Status artık UPPER_SNAKE_CASE dönüştürülmüş olmalı (Fix #1 ile birlikte)
        result.Value!.Status.Should().Be("PENDING");
    }

    [Fact]
    public async Task CreateOrder_ShouldTriggerFulfillment()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 5);
        var command = new CreateOrderCommand(new CreateOrderDto
        {
            Items = new List<OrderItemRequest> { new() { ProductId = productId, Quantity = 1 } },
            ShippingRate = "Regular",
            Source = "Web",
            ShippingAddress = new ShippingAddressDto
            {
                FullName = "Test", Phone = "555", AddressLine = "A", City = "B", District = "C", PostalCode = "D"
            }
        });

        // Act
        await BuildHandler().Handle(command, CancellationToken.None);

        // Assert — fulfillment servisi çağrılmalı
        _fulfillment.Verify(
            x => x.CreateShipmentForOrderAsync(It.IsAny<Order>()),
            Times.Once
        );
    }

    public void Dispose() => _db.Dispose();
}
