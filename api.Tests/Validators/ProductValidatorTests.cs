using api.Common.DTOs;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// CreateProductRequestValidator, UpdateProductRequestValidator,
/// CreateOfferRequestValidator, UpdateOfferRequestValidator testleri.
/// </summary>
public class ProductValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // CreateProductRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreateProductRequestValidator _createValidator = new();

    private static CreateProductRequest ValidCreateProduct() =>
        new(
            Name: "Test Ürünü",
            Description: "Bu bir test ürününün açıklamasıdır.",
            CategoryId: Guid.NewGuid(),
            Images: new List<string> { "https://cdn.example.com/image1.jpg" },
            Tags: new List<string> { "elektronik", "test" },
            Price: 150m,
            Stock: 50
        );

    [Fact]
    public void CreateProduct_WithValidData_PassesValidation()
    {
        var result = _createValidator.Validate(ValidCreateProduct());
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("AB")] // 2 karakter — minimum 3
    public void CreateProduct_WithTooShortName_FailsValidation(string name)
    {
        var product = ValidCreateProduct() with { Name = name };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void CreateProduct_WithNameOver200Chars_FailsValidation()
    {
        var product = ValidCreateProduct() with { Name = new string('A', 201) };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateProduct_WithDescriptionUnder10Chars_FailsValidation()
    {
        var product = ValidCreateProduct() with { Description = "Kısa" };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }

    [Fact]
    public void CreateProduct_WithDescriptionOver5000Chars_FailsValidation()
    {
        var product = ValidCreateProduct() with { Description = new string('X', 5001) };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateProduct_WithEmptyCategoryId_FailsValidation()
    {
        var product = ValidCreateProduct() with { CategoryId = Guid.Empty };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "CategoryId");
    }

    [Fact]
    public void CreateProduct_WithEmptyImages_FailsValidation()
    {
        var product = ValidCreateProduct() with { Images = new List<string>() };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Images");
    }

    [Fact]
    public void CreateProduct_WithOver10Images_FailsValidation()
    {
        var images = Enumerable.Range(1, 11)
            .Select(i => $"https://cdn.example.com/image{i}.jpg")
            .ToList();
        var product = ValidCreateProduct() with { Images = images };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateProduct_WithInvalidImageUrl_FailsValidation()
    {
        var product = ValidCreateProduct() with { Images = new List<string> { "not-a-valid-url" } };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateProduct_WithOver20Tags_FailsValidation()
    {
        var tags = Enumerable.Range(1, 21).Select(i => $"tag{i}").ToList();
        var product = ValidCreateProduct() with { Tags = tags };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateProductRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateProductRequestValidator _updateValidator = new();

    [Fact]
    public void UpdateProduct_WithAllNulls_PassesValidation()
    {
        // Tüm alanlar null ise (hiçbir şey güncellenmeyecek) geçerli sayılmalı
        var dto = new UpdateProductRequest();
        var result = _updateValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateProduct_WithValidName_PassesValidation()
    {
        var dto = new UpdateProductRequest { Name = "Yeni Geçerli İsim" };
        var result = _updateValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateProduct_WithTooShortName_FailsValidation()
    {
        var dto = new UpdateProductRequest { Name = "AB" };
        var result = _updateValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void UpdateProduct_WithEmptyImages_FailsValidation()
    {
        var dto = new UpdateProductRequest { Images = new List<string>() };
        var result = _updateValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CreateOfferRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreateOfferRequestValidator _offerValidator = new();

    private static CreateOfferRequest ValidOffer() =>
        new(
            ProductId: Guid.NewGuid(),
            Price: 99.99m,
            Stock: 10,
            PublishToMarket: true,
            PublishToStore: true
        );

    [Fact]
    public void CreateOffer_WithValidData_PassesValidation()
    {
        var result = _offerValidator.Validate(ValidOffer());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateOffer_WithZeroPrice_FailsValidation()
    {
        var offer = ValidOffer() with { Price = 0m };
        var result = _offerValidator.Validate(offer);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Price");
    }

    [Fact]
    public void CreateOffer_WithNegativeStock_FailsValidation()
    {
        var offer = ValidOffer() with { Stock = -1 };
        var result = _offerValidator.Validate(offer);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Stock");
    }

    [Fact]
    public void CreateOffer_WithEmptyProductId_FailsValidation()
    {
        var offer = ValidOffer() with { ProductId = Guid.Empty };
        var result = _offerValidator.Validate(offer);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ProductId");
    }

    [Fact]
    public void CreateOffer_WithStockOverLimit_FailsValidation()
    {
        var offer = ValidOffer() with { Stock = 100_001 };
        var result = _offerValidator.Validate(offer);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateOffer_WithPriceOverLimit_FailsValidation()
    {
        var offer = ValidOffer() with { Price = 1_000_000m };
        var result = _offerValidator.Validate(offer);
        result.IsValid.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateOfferRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateOfferRequestValidator _updateOfferValidator = new();

    [Fact]
    public void UpdateOffer_WithAllNulls_PassesValidation()
    {
        var dto = new UpdateOfferRequest(null, null, null, null);
        var result = _updateOfferValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateOffer_WithValidPrice_PassesValidation()
    {
        var dto = new UpdateOfferRequest(Price: 250m, Stock: null, PublishToMarket: null, PublishToStore: null);
        var result = _updateOfferValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateOffer_WithZeroPrice_FailsValidation()
    {
        var dto = new UpdateOfferRequest(Price: 0m, Stock: null, PublishToMarket: null, PublishToStore: null);
        var result = _updateOfferValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Price.Value");
    }

    [Fact]
    public void UpdateOffer_WithNegativeStock_FailsValidation()
    {
        var dto = new UpdateOfferRequest(Price: null, Stock: -5, PublishToMarket: null, PublishToStore: null);
        var result = _updateOfferValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Stock.Value");
    }
}
