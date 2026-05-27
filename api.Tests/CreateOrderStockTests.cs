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

namespace api.Tests;

/// <summary>
/// BUG FIX #3 — Race Condition on Stock Decrement
/// ────────────────────────────────────────────────
/// Sipariş oluşturma akışında stok kontrolü ve düşme işlemi
/// IsolationLevel.Serializable transaction içine alındı.
///
/// NOT: EF Core InMemory provider transaction semantiğini tam desteklemez.
/// Bu testler iş mantığı doğruluğunu (stok hesabı, hata yolları, fulfillment
/// tetiklenme) doğrular. Gerçek eşzamanlılık testi entegrasyon ortamında
/// (Postgres + testcontainers) çalıştırılmalıdır.
///
/// ServiceResult API: .Success / .Data / .Message
/// </summary>
public class CreateOrderStockTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<ICurrentUserService> _currentUser;
    private readonly Mock<IFulfillmentService> _fulfillment;
    private readonly Mock<IWalletService> _wallet;
    private readonly Mock<ICommissionService> _commission;
    private readonly Guid _customerId = Guid.NewGuid();

    public CreateOrderStockTests()
    {
        _db = TestDbContextFactory.Create();

        _currentUser = new Mock<ICurrentUserService>();
        _currentUser.Setup(x => x.UserId).Returns(_customerId);

        _fulfillment = new Mock<IFulfillmentService>();
        _fulfillment
            .Setup(x => x.CreateShipmentForOrderAsync(It.IsAny<Order>()))
            .ReturnsAsync(new Shipment());
        _fulfillment
            .Setup(x => x.CreateShipmentForVendorOrderAsync(It.IsAny<VendorOrder>(), It.IsAny<Order>()))
            .ReturnsAsync(new Shipment());

        _wallet = new Mock<IWalletService>();
        _wallet
            .Setup(w => w.HoldEscrowAsync(It.IsAny<VendorOrder>()))
            .Returns(Task.CompletedTask);

        _commission = new Mock<ICommissionService>();
        _commission
            .Setup(c => c.ResolveRateAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<PlanType?>()))
            .ReturnsAsync(10m);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Başarılı sipariş senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateOrder_WithSufficientStock_Succeeds()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 10, price: 150m);
        var command = BuildCommand(productId, quantity: 3);

        // Act
        var result = await Handle(command);

        // Assert — başarı
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateOrder_ReducesStockByExactQuantity()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 10);
        var command = BuildCommand(productId, quantity: 3);

        // Act
        await Handle(command);

        // Assert — 10 - 3 = 7
        var product = await _db.Products.FindAsync(productId);
        product!.Stock.Should().Be(7, "sipariş miktarı kadar stok düşürülmeli");
    }

    [Fact]
    public async Task CreateOrder_WithExactlyAvailableStock_Succeeds()
    {
        // Sınır değer: tam stok kadar sipariş
        var productId = await SeedProductAsync(stock: 5);
        var command = BuildCommand(productId, quantity: 5);

        var result = await Handle(command);

        result.Success.Should().BeTrue();
        var product = await _db.Products.FindAsync(productId);
        product!.Stock.Should().Be(0, "stok sıfıra düşebilir");
    }

    [Fact]
    public async Task CreateOrder_CalculatesTotalAmountCorrectly()
    {
        // Arrange — 4 adet × 75 TL = 300 TL
        var productId = await SeedProductAsync(stock: 10, price: 75m);
        var command = BuildCommand(productId, quantity: 4);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.TotalAmount.Should().Be(300m);
    }

    [Fact]
    public async Task CreateOrder_SetsCustomerIdFromCurrentUser()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 5);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        await Handle(command);

        // Assert — ICurrentUserService'ten gelen UserId order'a yazılmalı
        var order = await _db.Orders.FirstOrDefaultAsync();
        order!.CustomerId.Should().Be(_customerId);
    }

    [Fact]
    public async Task CreateOrder_PersistsOrderToDatabase()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 5);
        var command = BuildCommand(productId, quantity: 2);

        // Act
        var result = await Handle(command);

        // Assert — DB'de order kaydı oluşmalı
        var saved = await _db.Orders.FindAsync(result.Data!.Id);
        saved.Should().NotBeNull();
        saved!.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public async Task CreateOrder_TriggersCreateShipment_ExactlyOnce()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 5);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        await Handle(command);

        // Assert — fulfillment servisi çağrılmış olmalı (VendorOrder başına bir kez)
        _fulfillment.Verify(
            x => x.CreateShipmentForVendorOrderAsync(It.IsAny<VendorOrder>(), It.IsAny<Order>()),
            Times.Once,
            "Her başarılı sipariş için shipment oluşturulmalı"
        );
    }

    [Fact]
    public async Task CreateOrder_WithMultipleItems_ReducesEachProductStock()
    {
        // Arrange — farklı ürünlerden oluşan sepet
        var productA = await SeedProductAsync(stock: 10, price: 100m);
        var productB = await SeedProductAsync(stock: 20, price: 50m);

        var command = BuildCommandMulti((productA, 2), (productB, 5));

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue();

        var pA = await _db.Products.FindAsync(productA);
        var pB = await _db.Products.FindAsync(productB);
        pA!.Stock.Should().Be(8, "productA: 10 - 2 = 8");
        pB!.Stock.Should().Be(15, "productB: 20 - 5 = 15");

        // Toplam: 2×100 + 5×50 = 450
        result.Data!.TotalAmount.Should().Be(450m);
    }

    [Fact]
    public async Task CreateOrder_WithExpress_ParsesShippingRateCorrectly()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 5);
        var command = BuildCommand(productId, quantity: 1, shippingRate: "Express");

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeTrue();
        var order = await _db.Orders.FirstOrDefaultAsync();
        order!.ShippingRate.Should().Be(ShippingRate.Express);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hata senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_Fails()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 2);
        var command = BuildCommand(productId, quantity: 5);

        // Act
        var result = await Handle(command);

        // Assert — hata
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Insufficient");
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_DoesNotReduceStock()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 2);
        var command = BuildCommand(productId, quantity: 5);

        // Act
        await Handle(command);

        // Assert — başarısız sipariş stok düşürmemeli
        var product = await _db.Products.FindAsync(productId);
        product!.Stock.Should().Be(2, "başarısız siparişte stok değişmemeli");
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_DoesNotCreateOrderRecord()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 2);
        var command = BuildCommand(productId, quantity: 5);

        // Act
        await Handle(command);

        // Assert — DB'ye order yazılmamalı
        var count = await _db.Orders.CountAsync();
        count.Should().Be(0, "başarısız siparişte order kaydı oluşturulmamalı");
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_DoesNotTriggerFulfillment()
    {
        // Arrange
        var productId = await SeedProductAsync(stock: 2);
        var command = BuildCommand(productId, quantity: 5);

        // Act
        await Handle(command);

        // Assert — fulfillment çağrılmamalı
        _fulfillment.Verify(
            x => x.CreateShipmentForVendorOrderAsync(It.IsAny<VendorOrder>(), It.IsAny<Order>()),
            Times.Never,
            "Yetersiz stokta shipment oluşturulmamalı"
        );
    }

    [Fact]
    public async Task CreateOrder_WithNonExistentProduct_Fails()
    {
        // Arrange — seeded ürün yok, rastgele bir Guid
        var command = BuildCommand(Guid.NewGuid(), quantity: 1);

        // Act
        var result = await Handle(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Product not found");
    }

    [Fact]
    public async Task CreateOrder_WithDeletedProduct_Fails()
    {
        // Arrange — IsDeleted = true ürün
        var productId = await SeedProductAsync(stock: 10, isDeleted: true);
        var command = BuildCommand(productId, quantity: 1);

        // Act
        var result = await Handle(command);

        // Assert — silinmiş ürün siparişe eklenmemeli
        result.Success.Should().BeFalse();
        result
            .Message.Should()
            .Contain(
                "Product not found",
                because: "IsDeleted=true ürünler filtrelendiğinden bulunamadı hatası beklenir"
            );
    }

    [Fact]
    public async Task CreateOrder_WithOneInvalidItem_InMultiCart_Fails()
    {
        // Arrange — bir geçerli, bir geçersiz ürün
        var validProductId = await SeedProductAsync(stock: 10);
        var invalidProductId = Guid.NewGuid(); // mevcut değil

        var command = BuildCommandMulti((validProductId, 2), (invalidProductId, 1));

        // Act
        var result = await Handle(command);

        // Assert — herhangi bir ürün geçersizse sipariş başarısız olmalı
        result.Success.Should().BeFalse();

        // Geçerli ürünün stoğu da değişmemeli (atomik davranış)
        var validProduct = await _db.Products.FindAsync(validProductId);
        validProduct!.Stock.Should().Be(10, "kısmi başarıda da stok değişmemeli");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private CreateOrderCommandHandler BuildHandler() =>
        new(_db, _currentUser.Object, _fulfillment.Object, _wallet.Object, _commission.Object);

    private Task<ServiceResult<OrderDto>> Handle(CreateOrderCommand command) =>
        BuildHandler().Handle(command, CancellationToken.None);

    private async Task<Guid> SeedProductAsync(
        int stock,
        decimal price = 100m,
        bool isDeleted = false
    )
    {
        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            StoreName = "Test Mağazası",
            Slug = $"test-{Guid.NewGuid():N}",
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
            IsDeleted = isDeleted,
            Images = new List<string>(),
            CategoryId = Guid.NewGuid(),
        };

        _db.MerchantProfiles.Add(merchant);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product.Id;
    }

    private static CreateOrderCommand BuildCommand(
        Guid productId,
        int quantity,
        string shippingRate = "Regular",
        string source = "Marketplace"
    ) =>
        new(
            new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto>
                {
                    new() { ProductId = productId, Quantity = quantity },
                },
                ShippingRate = shippingRate,
                Source = source,
                ShippingAddress = SampleAddress(),
            }
        );

    private static CreateOrderCommand BuildCommandMulti(
        params (Guid productId, int quantity)[] items
    ) =>
        new(
            new CreateOrderDto
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
            }
        );

    private static ShippingAddressDto SampleAddress() =>
        new()
        {
            FullName = "Ali Veli",
            Phone = "555-123-4567",
            AddressLine = "Atatürk Cad. No: 42",
            City = "Istanbul",
            District = "Kadıköy",
            PostalCode = "34710",
        };

    public void Dispose() => _db.Dispose();
}
