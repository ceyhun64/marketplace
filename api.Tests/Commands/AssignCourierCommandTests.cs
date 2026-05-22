using api.Application.Commands.Fulfillment;
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
/// AssignCourierCommandHandler testleri.
/// Shipment bulunamama, inactive kurye ve başarılı atama senaryolarını kapsar.
/// </summary>
public class AssignCourierCommandTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<IFulfillmentService> _fulfillment;
    private readonly Mock<INotificationService> _notification;

    public AssignCourierCommandTests()
    {
        _db = TestDbContextFactory.Create();
        _fulfillment = new Mock<IFulfillmentService>();
        _notification = new Mock<INotificationService>();

        _notification
            .Setup(n => n.SendCourierAssignedNotificationAsync(It.IsAny<Shipment>()))
            .Returns(Task.CompletedTask);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hata senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenShipmentNotFound_ReturnsFail()
    {
        // Arrange — DB'de shipment yok
        var command = new AssignCourierCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Shipment");
    }

    [Fact]
    public async Task Handle_WhenCourierNotFound_ReturnsFail()
    {
        // Arrange — shipment var, kurye yok
        var shipmentId = await SeedShipmentAsync();
        var command = new AssignCourierCommand(shipmentId, Guid.NewGuid());

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("kurye");
    }

    [Fact]
    public async Task Handle_WhenCourierIsInactive_ReturnsFail()
    {
        // Arrange — kurye IsActive = false
        var shipmentId = await SeedShipmentAsync();
        var courierId = await SeedCourierAsync(isActive: false);
        var command = new AssignCourierCommand(shipmentId, courierId);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse(because: "Pasif kuryeye atama yapılamaz");
        result.Message.Should().Contain("kurye");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Başarı senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenValidAssignment_SetsCourierIdOnShipment()
    {
        // Arrange
        var shipmentId = await SeedShipmentAsync();
        var courierId = await SeedCourierAsync(isActive: true);
        var command = new AssignCourierCommand(shipmentId, courierId);

        // Act
        var result = await Handle(command);

        // Assert — shipment'ın CourierId güncellenmeli
        result.Success.Should().BeTrue();
        var shipment = await _db.Shipments.FindAsync(shipmentId);
        shipment!.CourierId.Should().Be(courierId);
    }

    [Fact]
    public async Task Handle_WhenValidAssignment_ReturnsShipmentDto()
    {
        // Arrange
        var shipmentId = await SeedShipmentAsync();
        var courierId = await SeedCourierAsync(isActive: true);
        var command = new AssignCourierCommand(shipmentId, courierId);

        // Act
        var result = await Handle(command);

        // Assert — DTO doğru alanlarla dönmeli
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(shipmentId);
        result.Data.CourierId.Should().Be(courierId);
    }

    [Fact]
    public async Task Handle_WhenValidAssignment_SendsCourierNotification()
    {
        // Arrange
        var shipmentId = await SeedShipmentAsync();
        var courierId = await SeedCourierAsync(isActive: true);
        var command = new AssignCourierCommand(shipmentId, courierId);

        // Act
        await Handle(command);

        // Assert — bildirim servisi çağrılmış olmalı
        _notification.Verify(
            n => n.SendCourierAssignedNotificationAsync(It.IsAny<Shipment>()),
            Times.Once,
            "Kurye atamalarında bildirim gönderilmeli");
    }

    [Fact]
    public async Task Handle_WhenValidAssignment_UpdatesShipmentTimestamp()
    {
        // Arrange
        var shipmentId = await SeedShipmentAsync();
        var courierId = await SeedCourierAsync(isActive: true);
        var before = DateTime.UtcNow.AddSeconds(-1);
        var command = new AssignCourierCommand(shipmentId, courierId);

        // Act
        await Handle(command);

        // Assert — UpdatedAt güncellenmeli
        var shipment = await _db.Shipments.FindAsync(shipmentId);
        shipment!.UpdatedAt.Should().BeAfter(before);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private AssignCourierCommandHandler BuildHandler() =>
        new(_db, _fulfillment.Object, _notification.Object);

    private Task<api.Infrastructure.Services.ServiceResult<api.Common.DTOs.ShipmentDto>>
        Handle(AssignCourierCommand command) =>
        BuildHandler().Handle(command, CancellationToken.None);

    private async Task<Guid> SeedShipmentAsync()
    {
        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = "customer@test.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash",
            Role = UserRole.Customer,
        };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            Customer = customer,
            Status = OrderStatus.Pending,
            TotalAmount = 100m,
        };

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Order = order,
            Status = ShipmentStatus.Pending,
            TrackingNumber = "TRK-001",
            EstimatedDelivery = DateTime.UtcNow.AddDays(3),
        };

        _db.Users.Add(customer);
        _db.Orders.Add(order);
        _db.Shipments.Add(shipment);
        await _db.SaveChangesAsync();
        return shipment.Id;
    }

    private async Task<Guid> SeedCourierAsync(bool isActive)
    {
        var courier = new Courier
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            IsActive = isActive,
        };
        _db.Couriers.Add(courier);
        await _db.SaveChangesAsync();
        return courier.Id;
    }

    public void Dispose() => _db.Dispose();
}
