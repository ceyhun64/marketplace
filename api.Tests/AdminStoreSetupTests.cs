using api.Controllers;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api.Tests;

/// <summary>
/// BUG FIX #2 — Missing Admin Store Setup Endpoint
/// Frontend: POST /api/admin/store/{merchantId}/setup
/// Bu endpoint AdminController'da yoktu. Fix ile eklendi.
/// </summary>
public class AdminStoreSetupTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AdminController _controller;

    public AdminStoreSetupTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _controller = new AdminController(_db);
    }

    [Fact]
    public async Task SetupMerchantStore_WithValidMerchant_ShouldUpdateFields()
    {
        // Arrange
        var merchantId = Guid.NewGuid();
        _db.MerchantProfiles.Add(new MerchantProfile
        {
            Id = merchantId,
            UserId = Guid.NewGuid(),
            StoreName = "Eski Ad",
            Slug = "eski-slug",
        });
        await _db.SaveChangesAsync();

        var dto = new AdminStoreSetupDto(
            StoreName: "Yeni Ad",
            Slug: "yeni-slug",
            Description: "Harika bir mağaza",
            LogoUrl: "https://cdn.example.com/logo.png",
            BannerUrl: null,
            HandlingHours: 24,
            Latitude: 41.015,
            Longitude: 28.979
        );

        // Act
        var result = await _controller.SetupMerchantStore(merchantId, dto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!.StoreName.Should().Be("Yeni Ad");
        merchant.Slug.Should().Be("yeni-slug");
        merchant.Description.Should().Be("Harika bir mağaza");
        merchant.LogoUrl.Should().Be("https://cdn.example.com/logo.png");
        merchant.HandlingHours.Should().Be(24);
        merchant.Latitude.Should().BeApproximately(41.015, 0.001);
    }

    [Fact]
    public async Task SetupMerchantStore_ShouldOnlyUpdateNonNullFields()
    {
        // Arrange
        var merchantId = Guid.NewGuid();
        _db.MerchantProfiles.Add(new MerchantProfile
        {
            Id = merchantId,
            UserId = Guid.NewGuid(),
            StoreName = "Korunacak Ad",
            Slug = "korunacak-slug",
            HandlingHours = 48,
        });
        await _db.SaveChangesAsync();

        // Sadece Description güncelle, StoreName null → korunmalı
        var dto = new AdminStoreSetupDto(
            StoreName: null,
            Slug: null,
            Description: "Sadece açıklama değişti",
            LogoUrl: null,
            BannerUrl: null,
            HandlingHours: null,
            Latitude: null,
            Longitude: null
        );

        // Act
        await _controller.SetupMerchantStore(merchantId, dto);

        // Assert
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!.StoreName.Should().Be("Korunacak Ad", "null field should not overwrite existing value");
        merchant.Slug.Should().Be("korunacak-slug");
        merchant.HandlingHours.Should().Be(48);
        merchant.Description.Should().Be("Sadece açıklama değişti");
    }

    [Fact]
    public async Task SetupMerchantStore_WithNonExistentMerchant_ShouldReturn404()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var dto = new AdminStoreSetupDto(null, null, null, null, null, null, null, null);

        // Act
        var result = await _controller.SetupMerchantStore(nonExistentId, dto);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task SetupMerchantStore_ShouldUpdateTimestamp()
    {
        // Arrange
        var merchantId = Guid.NewGuid();
        var before = DateTime.UtcNow.AddSeconds(-1);
        _db.MerchantProfiles.Add(new MerchantProfile
        {
            Id = merchantId,
            UserId = Guid.NewGuid(),
            StoreName = "Test",
            UpdatedAt = before,
        });
        await _db.SaveChangesAsync();

        var dto = new AdminStoreSetupDto("Yeni Ad", null, null, null, null, null, null, null);

        // Act
        await _controller.SetupMerchantStore(merchantId, dto);

        // Assert
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        merchant!.UpdatedAt.Should().BeAfter(before);
    }

    public void Dispose() => _db.Dispose();
}
