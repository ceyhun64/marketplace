using api.Common.DTOs;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// CreateMerchantRequestValidator ve UpdateMerchantProfileRequestValidator testleri.
/// </summary>
public class MerchantValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // CreateMerchantRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly CreateMerchantRequestValidator _createValidator = new();

    private static CreateMerchantRequest ValidCreateMerchant() =>
        new()
        {
            Email = "merchant@example.com",
            Password = "MerchantPass1",
            StoreName = "Test Mağazası",
            Slug = "test-magazasi",
            Latitude = 41.0082,
            Longitude = 28.9784,
            HandlingHours = 24,
        };

    [Fact]
    public void CreateMerchant_WithValidData_PassesValidation()
    {
        var result = _createValidator.Validate(ValidCreateMerchant());
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-email")]
    public void CreateMerchant_WithInvalidEmail_FailsValidation(string email)
    {
        var request = ValidCreateMerchant() with { Email = email };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Fact]
    public void CreateMerchant_WithEmailOver256Chars_FailsValidation()
    {
        var longEmail = new string('a', 250) + "@b.com";
        var request = ValidCreateMerchant() with { Email = longEmail };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("short")] // 5 karakter, büyük yok, rakam yok
    [InlineData("nouppercase1")] // büyük harf yok
    [InlineData("NoDigitsHere")] // rakam yok
    public void CreateMerchant_WithWeakPassword_FailsValidation(string password)
    {
        var request = ValidCreateMerchant() with { Password = password };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateMerchant_WithStoreNameUnder2Chars_FailsValidation()
    {
        var request = ValidCreateMerchant() with { StoreName = "A" };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "StoreName");
    }

    [Theory]
    [InlineData("valid-slug")]
    [InlineData("magazam")]
    [InlineData("test-magaza-123")]
    [InlineData("abc")]
    public void CreateMerchant_WithValidSlug_PassesValidation(string slug)
    {
        var request = ValidCreateMerchant() with { Slug = slug };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue(because: $"'{slug}' geçerli bir slug formatıdır");
    }

    [Theory]
    [InlineData("UPPERCASE")]
    [InlineData("has space")]
    [InlineData("special@chars")]
    [InlineData("-starts-with-dash")]
    [InlineData("ends-with-dash-")]
    public void CreateMerchant_WithInvalidSlug_FailsValidation(string slug)
    {
        var request = ValidCreateMerchant() with { Slug = slug };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse(because: $"'{slug}' geçersiz slug formatı içerir");
        result.Errors.Should().Contain(e => e.PropertyName == "Slug");
    }

    [Theory]
    [InlineData(-91.0)] // sınırın altı
    [InlineData(91.0)] // sınırın üstü
    public void CreateMerchant_WithInvalidLatitude_FailsValidation(double lat)
    {
        var request = ValidCreateMerchant() with { Latitude = lat };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Latitude");
    }

    [Theory]
    [InlineData(-90.0)] // sınır değer — geçerli
    [InlineData(90.0)] // sınır değer — geçerli
    [InlineData(0.0)]
    public void CreateMerchant_WithValidLatitude_PassesValidation(double lat)
    {
        var request = ValidCreateMerchant() with { Latitude = lat };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(-181.0)]
    [InlineData(181.0)]
    public void CreateMerchant_WithInvalidLongitude_FailsValidation(double lon)
    {
        var request = ValidCreateMerchant() with { Longitude = lon };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Longitude");
    }

    [Theory]
    [InlineData(0)] // sıfır — geçersiz (> 0 gerekli)
    [InlineData(169)] // 168 saat = 1 hafta sınırı aşıldı
    public void CreateMerchant_WithInvalidHandlingHours_FailsValidation(int hours)
    {
        var request = ValidCreateMerchant() with { HandlingHours = hours };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "HandlingHours");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(24)]
    [InlineData(168)]
    public void CreateMerchant_WithValidHandlingHours_PassesValidation(int hours)
    {
        var request = ValidCreateMerchant() with { HandlingHours = hours };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateMerchant_WithInvalidLogoUrl_FailsValidation()
    {
        var request = ValidCreateMerchant() with { LogoUrl = "not-a-url" };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "LogoUrl");
    }

    [Fact]
    public void CreateMerchant_WithValidLogoUrl_PassesValidation()
    {
        var request = ValidCreateMerchant() with { LogoUrl = "https://cdn.example.com/logo.png" };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateMerchant_WithNullLogoUrl_PassesValidation()
    {
        // LogoUrl opsiyonel
        var request = ValidCreateMerchant() with
        {
            LogoUrl = null,
        };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateMerchant_WithDescriptionOver1000Chars_FailsValidation()
    {
        var request = ValidCreateMerchant() with { Description = new string('X', 1001) };
        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateMerchantProfileRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateMerchantProfileRequestValidator _updateValidator = new();

    [Fact]
    public void UpdateMerchant_WithAllNullFields_PassesValidation()
    {
        var request = new UpdateMerchantProfileRequest();
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue(because: "Partial update — tüm alanlar opsiyonel");
    }

    [Fact]
    public void UpdateMerchant_WithValidPartialData_PassesValidation()
    {
        var request = new UpdateMerchantProfileRequest
        {
            StoreName = "Yeni Mağaza Adı",
            HandlingHours = 48,
        };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateMerchant_WithInvalidHandlingHours_FailsValidation()
    {
        var request = new UpdateMerchantProfileRequest { HandlingHours = 0 };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void UpdateMerchant_WithHandlingHours169_FailsValidation()
    {
        var request = new UpdateMerchantProfileRequest { HandlingHours = 169 };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void UpdateMerchant_WithInvalidLatitude_FailsValidation()
    {
        var request = new UpdateMerchantProfileRequest { Latitude = 95.0 };
        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }
}
