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
/// DeliveredConfirmCommandHandler testleri.
/// Durum geçiş doğrulaması (InTransit/PickedUp → OutForDelivery → Delivered)
/// ve izin kontrolü senaryolarını kapsar.
/// </summary>
public class DeliveredConfirmCommandTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<IFulfillmentService> _fulfillment;
    private readonly Mock<INotificationService> _notification;

    public DeliveredConfirmCommandTests()
    {
        _db = TestDbContextFactory.Create();
        _fulfillment = new Mock<IFulfillmentService>();
        _notification = new Mock<INotificationService>();

        // Varsayılan: TransitionStatusAsync başarılı
        _fulfillment
            .Setup(f => f.TransitionStatusAsync(
                It.IsAny<Shipment>(),
                It.IsAny<ShipmentStatus>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        _notification
            .Setup(n => n.SendShipmentStatusNotificationAsync(
                It.IsAny<Guid>(),
                It.IsAny<ShipmentStatus>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hata senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenCourierProfileNotFound_ReturnsFail()
    {
        // Arrange — Kurye profili DB'de yok
        var command = new DeliveredConfirmCommand(
            Guid.NewGuid(), Guid.NewGuid(), null, null);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Kurye");
    }

    [Fact]
    public async Task Handle_WhenShipmentNotFound_ReturnsFail()
    {
        // Arrange — kurye var, shipment yok
        var (courierUserId, _) = await SeedCourierAsync();
        var command = new DeliveredConfirmCommand(
            Guid.NewGuid(), courierUserId, null, null);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Shipment");
    }

    [Fact]
    public async Task Handle_WhenShipmentBelongsToDifferentCourier_ReturnsFail()
    {
        // Arrange — shipment farklı kuryeye ait
        var (_, courierId) = await SeedCourierAsync();
        var otherCourierUserId = Guid.NewGuid(); // farklı kullanıcı
        var otherCourier = new Courier
        {
            Id = Guid.NewGuid(),
            UserId = otherCourierUserId,
            IsActive = true,
        };
        _db.Couriers.Add(otherCourier);
        await _db.SaveChangesAsync();

        var shipmentId = await SeedShipmentAsync(courierId, ShipmentStatus.InTransit);
        var command = new DeliveredConfirmCommand(
            shipmentId, otherCourierUserId, null, null);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse(because: "Başka kuryenin shipment'ını teslim edemez");
    }

    [Theory]
    [InlineData(ShipmentStatus.Pending)]
    [InlineData(ShipmentStatus.LabelGenerated)]
    [InlineData(ShipmentStatus.Delivered)]
    [InlineData(ShipmentStatus.Failed)]
    public async Task Handle_WhenShipmentStatusIsInvalid_ReturnsFail(ShipmentStatus status)
    {
        // Arrange — geçersiz durum (teslim işlemi yapılamaz)
        var (courierUserId, courierId) = await SeedCourierAsync();
        var shipmentId = await SeedShipmentAsync(courierId, status);
        var command = new DeliveredConfirmCommand(
            shipmentId, courierUserId, null, null);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse(
            because: $"{status} durumundaki shipment için teslim onaylanamaz");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Başarı senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(ShipmentStatus.InTransit)]
    [InlineData(ShipmentStatus.OutForDelivery)]
    [InlineData(ShipmentStatus.PickedUp)]
    public async Task Handle_WhenStatusIsValidForDelivery_ReturnsSuccess(ShipmentStatus status)
    {
        // Arrange
        var (courierUserId, courierId) = await SeedCourierAsync();
        var shipmentId = await SeedShipmentAsync(courierId, status);
        var command = new DeliveredConfirmCommand(
            shipmentId, courierUserId, "Ali Veli", null);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue(
            because: $"{status} durumundan teslim onaylanabilir");
        result.Data!.Status.Should().Be(ShipmentStatus.Delivered.ToString());
    }

    [Fact]
    public async Task Handle_WhenStatusIsInTransit_CallsOutForDeliveryTransitionFirst()
    {
        // Arrange — InTransit ise önce OutForDelivery'e geçilmeli
        var (courierUserId, courierId) = await SeedCourierAsync();
        var shipmentId = await SeedShipmentAsync(courierId, ShipmentStatus.InTransit);
        var command = new DeliveredConfirmCommand(
            shipmentId, courierUserId, null, null);

        // Act
        await Handle(command);

        // Assert — OutForDelivery geçişi çağrılmış olmalı
        _fulfillment.Verify(
            f => f.TransitionStatusAsync(
                It.IsAny<Shipment>(),
                ShipmentStatus.OutForDelivery,
                It.IsAny<string>()),
            Times.Once,
            "InTransit → OutForDelivery → Delivered sırası izlenmeli");
    }

    [Fact]
    public async Task Handle_WhenStatusIsInTransit_CallsDeliveredTransition()
    {
        // Arrange
        var (courierUserId, courierId) = await SeedCourierAsync();
        var shipmentId = await SeedShipmentAsync(courierId, ShipmentStatus.InTransit);
        var command = new DeliveredConfirmCommand(
            shipmentId, courierUserId, null, null);

        // Act
        await Handle(command);

        // Assert — Delivered geçişi de çağrılmış olmalı
        _fulfillment.Verify(
            f => f.TransitionStatusAsync(
                It.IsAny<Shipment>(),
                ShipmentStatus.Delivered,
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WhenTransitionToDeliveredFails_ReturnsFail()
    {
        // Arrange — TransitionStatusAsync Delivered geçişinde hata fırlatıyor
        var (courierUserId, courierId) = await SeedCourierAsync();
        var shipmentId = await SeedShipmentAsync(courierId, ShipmentStatus.OutForDelivery);

        _fulfillment
            .Setup(f => f.TransitionStatusAsync(
                It.IsAny<Shipment>(),
                ShipmentStatus.Delivered,
                It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Geçersiz durum geçişi."));

        var command = new DeliveredConfirmCommand(
            shipmentId, courierUserId, null, null);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Geçersiz durum geçişi");
    }

    [Fact]
    public async Task Handle_WhenRecipientNameProvided_IncludesItInNote()
    {
        // Arrange — Teslim alan kişi adı notta yer almalı
        var (courierUserId, courierId) = await SeedCourierAsync();
        var shipmentId = await SeedShipmentAsync(courierId, ShipmentStatus.OutForDelivery);
        var command = new DeliveredConfirmCommand(
            shipmentId, courierUserId, "Fatma Hanım", null);

        // Act
        await Handle(command);

        // Assert — Delivered geçişi notta alıcı adını içermeli
        _fulfillment.Verify(
            f => f.TransitionStatusAsync(
                It.IsAny<Shipment>(),
                ShipmentStatus.Delivered,
                It.Is<string>(note => note.Contains("Fatma Hanım"))),
            Times.Once);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private DeliveredConfirmCommandHandler BuildHandler() =>
        new(_db, _fulfillment.Object, _notification.Object);

    private Task<ServiceResult<api.Common.DTOs.ShipmentDto>>
        Handle(DeliveredConfirmCommand command) =>
        BuildHandler().Handle(command, CancellationToken.None);

    /// <returns>(courierUserId, courierId)</returns>
    private async Task<(Guid courierUserId, Guid courierId)> SeedCourierAsync()
    {
        var userId = Guid.NewGuid();
        var courier = new Courier
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            IsActive = true,
        };
        _db.Couriers.Add(courier);
        await _db.SaveChangesAsync();
        return (userId, courier.Id);
    }

    private async Task<Guid> SeedShipmentAsync(Guid courierId, ShipmentStatus status)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            Status = OrderStatus.Pending,
            TotalAmount = 100m,
        };

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Order = order,
            CourierId = courierId,
            Status = status,
            TrackingNumber = "TRK-DELIVERED-001",
            EstimatedDelivery = DateTime.UtcNow.AddDays(1),
        };

        _db.Orders.Add(order);
        _db.Shipments.Add(shipment);
        await _db.SaveChangesAsync();
        return shipment.Id;
    }

    public void Dispose() => _db.Dispose();
}
