using api.Controllers;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using api.Tests.TestHelpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests;

/// <summary>
/// BUG FIX #2 — Missing Admin Store Setup Endpoint
/// ─────────────────────────────────────────────────
/// Frontend: POST /api/admin/store/{merchantId}/setup
/// Bu endpoint AdminController'da yoktu — Fix ile eklendi.
///
/// AdminController'ın ICurrentUserService bağımlılığı mock ile karşılanır.
/// InMemory DB ile izole, deterministik testler çalıştırılır.
/// </summary>
public class AdminStoreSetupTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AdminController _controller;

    public AdminStoreSetupTests()
    {
        _db = TestDbContextFactory.Create();

        // AdminController tüm bağımlılıklarını alır; Setup endpoint bunları kullanmaz.
        var currentUser = new Mock<ICurrentUserService>();
        var notification = new Mock<INotificationService>();
        var config = new Mock<IConfiguration>();
        var cache = new Mock<IDistributedCache>();
        var logger = new Mock<ILogger<AdminController>>();
        _controller = new AdminController(
            _db,
            currentUser.Object,
            notification.Object,
            config.Object,
            cache.Object,
            logger.Object
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Başarılı güncelleme senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SetupMerchantStore_WithAllFields_UpdatesAllProperties()
    {
        // Arrange
        var merchantId = await SeedMerchantAsync("Eski Ad", "eski-slug");

        var dto = new AdminStoreSetupDto(
            StoreName: "Yeni Mağaza Adı",
            Slug: "yeni-magaza-adi",
            Description: "Harika bir mağaza açıklaması",
            LogoUrl: "https://cdn.example.com/logo.png",
            BannerUrl: "https://cdn.example.com/banner.jpg",
            HandlingHours: 48,
            Latitude: 41.0082,
            Longitude: 28.9784,
            Plan: null
        );

        // Act
        var result = await _controller.SetupMerchantStore(merchantId, dto);

        // Assert — HTTP 200
        result.Should().BeOfType<OkObjectResult>();

        // Assert — DB'de tüm alanlar güncellenmiş
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!.StoreName.Should().Be("Yeni Mağaza Adı");
        merchant.Slug.Should().Be("yeni-magaza-adi");
        merchant.Description.Should().Be("Harika bir mağaza açıklaması");
        merchant.LogoUrl.Should().Be("https://cdn.example.com/logo.png");
        merchant.BannerUrl.Should().Be("https://cdn.example.com/banner.jpg");
        merchant.HandlingHours.Should().Be(48);
        merchant.Latitude.Should().BeApproximately(41.0082, precision: 0.0001);
        merchant.Longitude.Should().BeApproximately(28.9784, precision: 0.0001);
    }

    [Fact]
    public async Task SetupMerchantStore_WithPartialFields_OnlyUpdatesNonNullFields()
    {
        // Arrange — mevcut değerler korunacak
        var merchantId = await SeedMerchantAsync(
            storeName: "Korunacak Ad",
            slug: "korunacak-slug",
            handlingHours: 72,
            logoUrl: "https://cdn.example.com/mevcut-logo.png"
        );

        // Sadece Description güncelleniyor; diğer alanlar null → dokunulmamalı
        var dto = new AdminStoreSetupDto(
            StoreName: null,
            Slug: null,
            Description: "Yeni açıklama",
            LogoUrl: null,
            BannerUrl: null,
            HandlingHours: null,
            Latitude: null,
            Longitude: null,
            Plan: null
        );

        // Act
        await _controller.SetupMerchantStore(merchantId, dto);

        // Assert — null gönderilen alanlar eski değerlerini korumalı
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!.StoreName.Should().Be("Korunacak Ad", "null StoreName mevcut değeri ezmemeli");
        merchant.Slug.Should().Be("korunacak-slug", "null Slug mevcut değeri ezmemeli");
        merchant.HandlingHours.Should().Be(72, "null HandlingHours mevcut değeri ezmemeli");
        merchant
            .LogoUrl.Should()
            .Be("https://cdn.example.com/mevcut-logo.png", "null LogoUrl mevcut değeri ezmemeli");
        merchant.Description.Should().Be("Yeni açıklama", "Description güncellenmeli");
    }

    [Fact]
    public async Task SetupMerchantStore_UpdatesTimestamp()
    {
        // Arrange
        var before = DateTime.UtcNow.AddSeconds(-1);
        var merchantId = await SeedMerchantAsync(updatedAt: before);

        var dto = new AdminStoreSetupDto("Yeni Ad", null, null, null, null, null, null, null, null);

        // Act
        await _controller.SetupMerchantStore(merchantId, dto);

        // Assert — UpdatedAt güncellenmiş olmalı
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!
            .UpdatedAt.Should()
            .BeAfter(
                before,
                because: "Store setup her zaman UpdatedAt'i şimdiki zamana çekmelidir"
            );
    }

    [Fact]
    public async Task SetupMerchantStore_ReturnsOkWithMerchantId()
    {
        // Arrange
        var merchantId = await SeedMerchantAsync();
        var dto = new AdminStoreSetupDto("Test", null, null, null, null, null, null, null, null);

        // Act
        var result = await _controller.SetupMerchantStore(merchantId, dto) as OkObjectResult;

        // Assert — Response body merchantId içermeli
        result.Should().NotBeNull();
        var body = result!.Value!;
        body.ToString()
            .Should()
            .Contain(
                merchantId.ToString(),
                because: "Response body'de hangi merchant güncellendiği belirtilmeli"
            );
    }

    [Fact]
    public async Task SetupMerchantStore_WithAllNullFields_OnlyUpdatesTimestamp()
    {
        // Arrange
        var merchantId = await SeedMerchantAsync(
            storeName: "Değişmeyecek",
            slug: "degismeyecek",
            handlingHours: 24
        );
        var before = DateTime.UtcNow.AddSeconds(-1);

        var dto = new AdminStoreSetupDto(null, null, null, null, null, null, null, null, null);

        // Act
        var result = await _controller.SetupMerchantStore(merchantId, dto);

        // Assert — 200 dönmeli, alanlar korunmalı, sadece timestamp değişmeli
        result.Should().BeOfType<OkObjectResult>();
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!.StoreName.Should().Be("Değişmeyecek");
        merchant.HandlingHours.Should().Be(24);
        merchant.UpdatedAt.Should().BeAfter(before);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hata senaryoları
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SetupMerchantStore_WithNonExistentMerchantId_Returns404()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var dto = new AdminStoreSetupDto(null, null, null, null, null, null, null, null, null);

        // Act
        var result = await _controller.SetupMerchantStore(nonExistentId, dto);

        // Assert
        result
            .Should()
            .BeOfType<NotFoundObjectResult>(
                because: "Olmayan bir merchant için 404 dönmesi beklenir"
            );
    }

    [Fact]
    public async Task SetupMerchantStore_DoesNotAffectOtherMerchants()
    {
        // Arrange — iki farklı merchant
        var targetId = await SeedMerchantAsync("Hedef Mağaza", "hedef");
        var otherId = await SeedMerchantAsync("Diğer Mağaza", "diger");

        var dto = new AdminStoreSetupDto(
            "Güncellenmiş Hedef",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );

        // Act
        await _controller.SetupMerchantStore(targetId, dto);

        // Assert — diğer merchant etkilenmemeli
        var other = await _db.MerchantProfiles.FindAsync(otherId);
        other!
            .StoreName.Should()
            .Be("Diğer Mağaza", because: "Başka bir merchant'ın verisi değiştirilmiş olmamalı");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<Guid> SeedMerchantAsync(
        string storeName = "Test Mağaza",
        string slug = "test-magaza",
        int handlingHours = 24,
        string? logoUrl = null,
        DateTime? updatedAt = null
    )
    {
        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            StoreName = storeName,
            Slug = slug,
            HandlingHours = handlingHours,
            LogoUrl = logoUrl,
            UpdatedAt = updatedAt ?? DateTime.UtcNow.AddDays(-1),
        };

        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync();
        return merchant.Id;
    }

    public void Dispose() => _db.Dispose();
}
