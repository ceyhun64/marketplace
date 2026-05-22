using api.Application.Commands.Orders;
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
/// PackOrderCommandHandler testleri.
/// Merchant sipariş hazırlama akışı: merchant doğrulama, durum geçişi ve bildirim.
/// </summary>
public class PackOrderCommandTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<INotificationService> _notification;

    public PackOrderCommandTests()
    {
        _db = TestDbContextFactory.Create();
        _notification = new Mock<INotificationService>();

        _notification
            .Setup(n => n.SendOrderStatusNotificationAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hata senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenMerchantProfileNotFound_ReturnsFail()
    {
        // Arrange — Merchant profili DB'de yok
        var command = new PackOrderCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Merchant");
    }

    [Fact]
    public async Task Handle_WhenOrderNotFoundForMerchant_ReturnsFail()
    {
        // Arrange — merchant var, sipariş yok
        var merchantUserId = await SeedMerchantAsync();
        var command = new PackOrderCommand(Guid.NewGuid(), merchantUserId);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Sipariş");
    }

    [Fact]
    public async Task Handle_WhenOrderBelongsToDifferentMerchant_ReturnsFail()
    {
        // Arrange — order başka merchanta ait
        var merchantUserId = await SeedMerchantAsync();
        var otherMerchantUserId = await SeedMerchantAsync(); // farklı merchant
        var orderId = await SeedOrderAsync(otherMerchantUserId, OrderStatus.Pending);

        var command = new PackOrderCommand(orderId, merchantUserId);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse(
            because: "Merchant yalnızca kendi siparişlerini hazırlayabilir");
    }

    [Theory]
    [InlineData(OrderStatus.Shipped)]
    [InlineData(OrderStatus.Delivered)]
    [InlineData(OrderStatus.Cancelled)]
    [InlineData(OrderStatus.LabelGenerated)]
    public async Task Handle_WhenOrderStatusIsInvalid_ReturnsFail(OrderStatus status)
    {
        // Arrange — geçersiz sipariş durumu
        var merchantUserId = await SeedMerchantAsync();
        var orderId = await SeedOrderAsync(merchantUserId, status);
        var command = new PackOrderCommand(orderId, merchantUserId);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse(
            because: $"{status} durumundaki sipariş hazırlanamaz");
        result.Message.Should().Contain("hazırlanamaz");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Başarı senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(OrderStatus.Pending)]
    [InlineData(OrderStatus.PaymentConfirmed)]
    public async Task Handle_WhenOrderIsInValidStatus_TransitionsToLabelGenerated(
        OrderStatus initialStatus)
    {
        // Arrange
        var merchantUserId = await SeedMerchantAsync();
        var orderId = await SeedOrderAsync(merchantUserId, initialStatus);
        var command = new PackOrderCommand(orderId, merchantUserId);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue();
        var order = await _db.Orders.FindAsync(orderId);
        order!.Status.Should().Be(OrderStatus.LabelGenerated,
            because: "Merchant hazırladığında sipariş LabelGenerated durumuna geçmeli");
    }

    [Fact]
    public async Task Handle_WhenValid_ReturnsOrderDtoWithLabelGeneratedStatus()
    {
        // Arrange
        var merchantUserId = await SeedMerchantAsync();
        var orderId = await SeedOrderAsync(merchantUserId, OrderStatus.Pending);
        var command = new PackOrderCommand(orderId, merchantUserId);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(orderId);
        result.Data.Status.Should().Be(OrderStatus.LabelGenerated.ToString());
    }

    [Fact]
    public async Task Handle_WhenValid_SendsStatusNotification()
    {
        // Arrange
        var merchantUserId = await SeedMerchantAsync();
        var orderId = await SeedOrderAsync(merchantUserId, OrderStatus.Pending);
        var command = new PackOrderCommand(orderId, merchantUserId);

        // Act
        await Handle(command);

        // Assert — müşteriye bildirim gönderilmeli
        _notification.Verify(
            n => n.SendOrderStatusNotificationAsync(
                It.Is<Guid>(id => id == orderId),
                It.IsAny<string>()),
            Times.Once,
            "Sipariş hazırlandığında bildirim gönderilmeli");
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesOrderTimestamp()
    {
        // Arrange
        var merchantUserId = await SeedMerchantAsync();
        var orderId = await SeedOrderAsync(merchantUserId, OrderStatus.Pending);
        var before = DateTime.UtcNow.AddSeconds(-1);
        var command = new PackOrderCommand(orderId, merchantUserId);

        // Act
        await Handle(command);

        // Assert
        var order = await _db.Orders.FindAsync(orderId);
        order!.UpdatedAt.Should().BeAfter(before);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private PackOrderCommandHandler BuildHandler() =>
        new(_db, _notification.Object);

    private Task<ServiceResult<api.Common.DTOs.OrderDto>>
        Handle(PackOrderCommand command) =>
        BuildHandler().Handle(command, CancellationToken.None);

    private async Task<Guid> SeedMerchantAsync()
    {
        var userId = Guid.NewGuid();
        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StoreName = $"Test Store {userId:N}",
            Slug = $"test-{Guid.NewGuid():N}",
        };
        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync();
        return userId;
    }

    private async Task<Guid> SeedOrderAsync(Guid merchantUserId, OrderStatus status)
    {
        var merchant = await _db.MerchantProfiles
            .FirstAsync(m => m.UserId == merchantUserId);

        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = $"customer-{Guid.NewGuid():N}@test.com",
            FirstName = "Ali",
            LastName = "Veli",
            PasswordHash = "hash",
            Role = UserRole.Customer,
        };

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchant.Id,
            Name = "Test Product",
            Price = 50m,
            Stock = 100,
            IsApproved = true,
            Images = new List<string>(),
            CategoryId = Guid.NewGuid(),
        };

        var orderItem = new OrderItem
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Product = product,
            MerchantId = merchant.Id,
            ProductName = "Test Product",
            UnitPrice = 50m,
            Quantity = 2,
        };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            Customer = customer,
            Status = status,
            TotalAmount = 100m,
            Items = new List<OrderItem> { orderItem },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow.AddMinutes(-5),
        };

        _db.Users.Add(customer);
        _db.Products.Add(product);
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        return order.Id;
    }

    public void Dispose() => _db.Dispose();
}
