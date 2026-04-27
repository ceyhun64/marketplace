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
        new()
        {
            Name = "Test Ürünü",
            Description = "Bu bir test ürününün açıklamasıdır.",
            CategoryId = Guid.NewGuid(),
            Images = new List<string> { "https://cdn.example.com/image1.jpg" },
            Tags = new List<string> { "elektronik", "test" },
            Price = 150m,
            Stock = 50,
        };

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
    public void CreateProduct_WithNoImages_FailsValidation()
    {
        var product = ValidCreateProduct() with { Images = new List<string>() };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Images");
    }

    [Fact]
    public void CreateProduct_With11Images_FailsValidation()
    {
        var product = ValidCreateProduct() with
        {
            Images = Enumerable
                .Range(1, 11)
                .Select(i => $"https://cdn.example.com/img{i}.jpg")
                .ToList(),
        };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateProduct_With10Images_PassesValidation()
    {
        var product = ValidCreateProduct() with
        {
            Images = Enumerable
                .Range(1, 10)
                .Select(i => $"https://cdn.example.com/img{i}.jpg")
                .ToList(),
        };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateProduct_WithInvalidImageUrl_FailsValidation()
    {
        var product = ValidCreateProduct() with { Images = new List<string> { "not-a-valid-url" } };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateProduct_With21Tags_FailsValidation()
    {
        var product = ValidCreateProduct() with
        {
            Tags = Enumerable.Range(1, 21).Select(i => $"tag{i}").ToList(),
        };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Tags");
    }

    [Fact]
    public void CreateProduct_With20Tags_PassesValidation()
    {
        var product = ValidCreateProduct() with
        {
            Tags = Enumerable.Range(1, 20).Select(i => $"tag{i}").ToList(),
        };
        var result = _createValidator.Validate(product);
        result.IsValid.Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateProductRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateProductRequestValidator _updateValidator = new();

    [Fact]
    public void UpdateProduct_WithAllNullFields_PassesValidation()
    {
        // Tüm alanlar null — partial update, geçerli olmalı
        var request = new UpdateProductRequest();
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateProduct_WithValidName_PassesValidation()
    {
        var request = new UpdateProductRequest { Name = "Yeni Ürün Adı" };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateProduct_WithTooShortName_FailsValidation()
    {
        var request = new UpdateProductRequest { Name = "AB" };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void UpdateProduct_WithValidDescription_PassesValidation()
    {
        var request = new UpdateProductRequest
        {
            Description = "Yeterince uzun bir açıklama metni.",
        };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateProduct_WithTooShortDescription_FailsValidation()
    {
        var request = new UpdateProductRequest { Description = "Kısa" };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CreateOfferRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreateOfferRequestValidator _offerValidator = new();

    [Fact]
    public void CreateOffer_WithValidData_PassesValidation()
    {
        var request = new CreateOfferRequest
        {
            ProductId = Guid.NewGuid(),
            Price = 99.99m,
            Stock = 100,
        };
        var result = _offerValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateOffer_WithZeroPrice_FailsValidation()
    {
        var request = new CreateOfferRequest
        {
            ProductId = Guid.NewGuid(),
            Price = 0m,
            Stock = 10,
        };
        var result = _offerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Price");
    }

    [Fact]
    public void CreateOffer_WithNegativePrice_FailsValidation()
    {
        var request = new CreateOfferRequest
        {
            ProductId = Guid.NewGuid(),
            Price = -1m,
            Stock = 10,
        };
        var result = _offerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateOffer_WithNegativeStock_FailsValidation()
    {
        var request = new CreateOfferRequest
        {
            ProductId = Guid.NewGuid(),
            Price = 50m,
            Stock = -1,
        };
        var result = _offerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Stock");
    }

    [Fact]
    public void CreateOffer_WithStockOver100000_FailsValidation()
    {
        var request = new CreateOfferRequest
        {
            ProductId = Guid.NewGuid(),
            Price = 50m,
            Stock = 100_001,
        };
        var result = _offerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateOffer_WithZeroStock_PassesValidation()
    {
        var request = new CreateOfferRequest
        {
            ProductId = Guid.NewGuid(),
            Price = 50m,
            Stock = 0,
        };
        var result = _offerValidator.Validate(request);
        result.IsValid.Should().BeTrue(because: "Stok sıfır geçerli — tükenen ürün");
    }
}
