using api.Common.DTOs;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// CategoryValidator (CreateCategoryRequest, UpdateCategoryRequest) testleri.
/// </summary>
public class CategoryValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // CreateCategoryRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreateCategoryRequestValidator _createValidator = new();

    [Fact]
    public void CreateCategory_WithValidData_PassesValidation()
    {
        // Arrange
        var req = new CreateCategoryRequest("Electronics", "electronics", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateCategory_WithEmptyName_FailsValidation()
    {
        // Arrange
        var req = new CreateCategoryRequest("", "electronics", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void CreateCategory_WithSingleCharName_FailsValidation()
    {
        // Arrange — minimum 2 karakter gerekli
        var req = new CreateCategoryRequest("E", "electronics", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result
            .Errors.Should()
            .Contain(e => e.PropertyName == "Name" && e.ErrorMessage.Contains("2 characters"));
    }

    [Fact]
    public void CreateCategory_WithExactly2CharName_PassesValidation()
    {
        // Arrange — sınır değer: tam 2 karakter
        var req = new CreateCategoryRequest("IT", "it", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateCategory_WithNameExceeding100Chars_FailsValidation()
    {
        // Arrange
        var req = new CreateCategoryRequest(new string('A', 101), "electronics", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result
            .Errors.Should()
            .Contain(e => e.PropertyName == "Name" && e.ErrorMessage.Contains("100 characters"));
    }

    [Fact]
    public void CreateCategory_WithExactly100CharName_PassesValidation()
    {
        // Arrange — sınır değer
        var req = new CreateCategoryRequest(new string('A', 100), "electronics", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateCategory_WithEmptySlug_FailsValidation()
    {
        // Arrange
        var req = new CreateCategoryRequest("Electronics", "", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    [Theory]
    [InlineData("Electronics")] // büyük harf
    [InlineData("ELECTRONICS")] // tam büyük harf
    [InlineData("my category")] // boşluk içeriyor
    [InlineData("my_category")] // alt çizgi
    [InlineData("-leading-hyphen")] // baştaki tire
    [InlineData("trailing-hyphen-")] // sondaki tire
    [InlineData("double--hyphen")] // çift tire
    public void CreateCategory_WithInvalidSlugPattern_FailsValidation(string slug)
    {
        // Arrange
        var req = new CreateCategoryRequest("Electronics", slug, null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse(because: $"'{slug}' geçerli bir slug formatı değil");
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    [Theory]
    [InlineData("electronics")]
    [InlineData("mobile-phones")]
    [InlineData("cat123")]
    [InlineData("a1-b2-c3")]
    public void CreateCategory_WithValidSlugPattern_PassesValidation(string slug)
    {
        // Arrange
        var req = new CreateCategoryRequest("Electronics", slug, null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue(because: $"'{slug}' geçerli bir slug formatıdır");
    }

    [Fact]
    public void CreateCategory_WithNullIconUrl_PassesValidation()
    {
        // Arrange — IconUrl isteğe bağlı
        var req = new CreateCategoryRequest("Electronics", "electronics", null, null);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateCategory_WithValidIconUrl_PassesValidation()
    {
        // Arrange
        var req = new CreateCategoryRequest(
            "Electronics",
            "electronics",
            null,
            "https://cdn.example.com/icon.svg"
        );

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("not-a-url")]
    [InlineData("just-text")]
    [InlineData("relative/path")]
    public void CreateCategory_WithInvalidIconUrl_FailsValidation(string iconUrl)
    {
        // Arrange
        var req = new CreateCategoryRequest("Electronics", "electronics", null, iconUrl);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse(because: $"'{iconUrl}' geçerli bir URL değil");
        result.Errors.Should().Contain(e => e.PropertyName == "IconUrl");
    }

    [Fact]
    public void CreateCategory_WithNegativeSortOrder_FailsValidation()
    {
        // Arrange
        var req = new CreateCategoryRequest("Electronics", "electronics", null, null, -1);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "SortOrder");
    }

    [Fact]
    public void CreateCategory_WithZeroSortOrder_PassesValidation()
    {
        // Arrange — sınır değer: 0 geçerli
        var req = new CreateCategoryRequest("Electronics", "electronics", null, null, 0);

        // Act
        var result = _createValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateCategoryRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateCategoryRequestValidator _updateValidator = new();

    [Fact]
    public void UpdateCategory_WithAllNullFields_PassesValidation()
    {
        // Arrange — tüm alanlar isteğe bağlı; null olan alanlar doğrulanmaz
        var req = new UpdateCategoryRequest(null, null, null, null, null);

        // Act
        var result = _updateValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateCategory_WithSingleCharName_FailsValidation()
    {
        // Arrange — Name sağlanmışsa minimum 2 karakter
        var req = new UpdateCategoryRequest("E", null, null, null, null);

        // Act
        var result = _updateValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void UpdateCategory_WithValidName_PassesValidation()
    {
        // Arrange
        var req = new UpdateCategoryRequest("Electronics Updated", null, null, null, null);

        // Act
        var result = _updateValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("Bad Slug")]
    [InlineData("Bad_Slug")]
    [InlineData("BAD-SLUG")]
    public void UpdateCategory_WithInvalidSlug_FailsValidation(string slug)
    {
        // Arrange
        var req = new UpdateCategoryRequest(null, slug, null, null, null);

        // Act
        var result = _updateValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    [Fact]
    public void UpdateCategory_WithNegativeSortOrder_FailsValidation()
    {
        // Arrange
        var req = new UpdateCategoryRequest(null, null, null, null, -5);

        // Act
        var result = _updateValidator.Validate(req);

        // Assert — FluentValidation exposes the error on the nullable's inner Value path
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("negative"));
    }

    [Fact]
    public void UpdateCategory_WithInvalidIconUrl_FailsValidation()
    {
        // Arrange
        var req = new UpdateCategoryRequest(null, null, null, "not-a-url", null);

        // Act
        var result = _updateValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "IconUrl");
    }

    [Fact]
    public void UpdateCategory_WithAllValidFields_PassesValidation()
    {
        // Arrange
        var req = new UpdateCategoryRequest(
            "Electronics",
            "electronics-updated",
            null,
            "https://cdn.example.com/icon.svg",
            5
        );

        // Act
        var result = _updateValidator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
