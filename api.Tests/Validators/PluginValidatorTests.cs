using api.Common.DTOs;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// PluginValidator (CreatePluginValidator, UpdatePluginConfigValidator) testleri.
/// </summary>
public class PluginValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // CreatePluginValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreatePluginValidator _createValidator = new();

    private static CreatePluginDto ValidDto() => new()
    {
        Name             = "Analytics Pro",
        Slug             = "analytics-pro",
        Description      = "Detailed sales analytics for merchants.",
        Category         = "Analytics",
        MonthlyPrice     = 29.99m,
        MinimumPlan      = "Pro",
        DocumentationUrl = "https://docs.example.com/analytics-pro",
        DeveloperName    = "Acme Corp",
    };

    [Fact]
    public void CreatePlugin_WithValidData_PassesValidation()
    {
        // Arrange
        var dto = ValidDto();

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    // ── Name ─────────────────────────────────────────────────────────────────

    [Fact]
    public void CreatePlugin_WithEmptyName_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.Name = "";

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void CreatePlugin_WithNameExceeding100Chars_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.Name = new string('A', 101);

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    // ── Slug ─────────────────────────────────────────────────────────────────

    [Fact]
    public void CreatePlugin_WithEmptySlug_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.Slug = "";

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    [Theory]
    [InlineData("Analytics-Pro")]  // büyük harf
    [InlineData("analytics pro")] // boşluk
    [InlineData("analytics_pro")] // alt çizgi
    [InlineData("ANALYTICS")]
    public void CreatePlugin_WithInvalidSlugCharacters_FailsValidation(string slug)
    {
        // Arrange
        var dto = ValidDto();
        dto.Slug = slug;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse(because: $"'{slug}' geçerli bir slug değil");
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    [Fact]
    public void CreatePlugin_WithSlugExceeding80Chars_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.Slug = new string('a', 81);

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    // ── Description ──────────────────────────────────────────────────────────

    [Fact]
    public void CreatePlugin_WithEmptyDescription_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.Description = "";

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }

    [Fact]
    public void CreatePlugin_WithDescriptionExceeding500Chars_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.Description = new string('D', 501);

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }

    // ── Category ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("SEO")]
    [InlineData("Analytics")]
    [InlineData("Chat")]
    [InlineData("Marketing")]
    [InlineData("Accounting")]
    [InlineData("Shipping")]
    [InlineData("Other")]
    public void CreatePlugin_WithValidCategory_PassesValidation(string category)
    {
        // Arrange
        var dto = ValidDto();
        dto.Category = category;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue(because: $"'{category}' geçerli bir kategoridir");
    }

    [Theory]
    [InlineData("seo")]
    [InlineData("ANALYTICS")]
    [InlineData("Finance")]
    [InlineData("")]
    public void CreatePlugin_WithInvalidCategory_FailsValidation(string category)
    {
        // Arrange
        var dto = ValidDto();
        dto.Category = category;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse(because: $"'{category}' geçersiz bir kategoridir");
        result.Errors.Should().Contain(e => e.PropertyName == "Category");
    }

    // ── MonthlyPrice ─────────────────────────────────────────────────────────

    [Fact]
    public void CreatePlugin_WithNegativeMonthlyPrice_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.MonthlyPrice = -0.01m;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "MonthlyPrice");
    }

    [Fact]
    public void CreatePlugin_WithZeroMonthlyPrice_PassesValidation()
    {
        // Arrange — ücretsiz eklenti geçerlidir
        var dto = ValidDto();
        dto.MonthlyPrice = 0m;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    // ── MinimumPlan ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Basic")]
    [InlineData("Pro")]
    [InlineData("Enterprise")]
    public void CreatePlugin_WithValidMinimumPlan_PassesValidation(string plan)
    {
        // Arrange
        var dto = ValidDto();
        dto.MinimumPlan = plan;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue(because: $"'{plan}' geçerli bir plandır");
    }

    [Theory]
    [InlineData("basic")]
    [InlineData("ENTERPRISE")]
    [InlineData("Starter")]
    [InlineData("Free")]
    public void CreatePlugin_WithInvalidMinimumPlan_FailsValidation(string plan)
    {
        // Arrange
        var dto = ValidDto();
        dto.MinimumPlan = plan;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse(because: $"'{plan}' geçersiz plan tipidir");
        result.Errors.Should().Contain(e => e.PropertyName == "MinimumPlan");
    }

    // ── DocumentationUrl ─────────────────────────────────────────────────────

    [Fact]
    public void CreatePlugin_WithNullDocumentationUrl_PassesValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.DocumentationUrl = null;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreatePlugin_WithInvalidDocumentationUrl_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.DocumentationUrl = "not-a-valid-url";

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DocumentationUrl");
    }

    [Fact]
    public void CreatePlugin_WithValidDocumentationUrl_PassesValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.DocumentationUrl = "https://docs.example.com";

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    // ── DeveloperName ────────────────────────────────────────────────────────

    [Fact]
    public void CreatePlugin_WithNullDeveloperName_PassesValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.DeveloperName = null;

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreatePlugin_WithDeveloperNameExceeding100Chars_FailsValidation()
    {
        // Arrange
        var dto = ValidDto();
        dto.DeveloperName = new string('X', 101);

        // Act
        var result = _createValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DeveloperName");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdatePluginConfigValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdatePluginConfigValidator _updateValidator = new();

    [Fact]
    public void UpdatePluginConfig_WithNullConfig_PassesValidation()
    {
        // Arrange
        var dto = new UpdatePluginConfigDto { Config = null };

        // Act
        var result = _updateValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdatePluginConfig_WithConfigExceeding4000Chars_FailsValidation()
    {
        // Arrange
        var dto = new UpdatePluginConfigDto { Config = new string('C', 4001) };

        // Act
        var result = _updateValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Config");
    }

    [Fact]
    public void UpdatePluginConfig_WithExactly4000CharConfig_PassesValidation()
    {
        // Arrange — sınır değer: tam 4000 karakter geçerli
        var dto = new UpdatePluginConfigDto { Config = new string('C', 4000) };

        // Act
        var result = _updateValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdatePluginConfig_WithValidJsonConfig_PassesValidation()
    {
        // Arrange
        var dto = new UpdatePluginConfigDto
        {
            Config = """{"apiKey":"sk-test","trackingEnabled":true}""",
        };

        // Act
        var result = _updateValidator.Validate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
