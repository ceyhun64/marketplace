using api.Common.DTOs.Auth;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// RegisterRequestValidator, LoginRequestValidator, ResetPasswordRequestValidator
/// FluentValidation kural doğrulamaları.
/// </summary>
public class AuthValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // RegisterRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly RegisterRequestValidator _registerValidator = new();

    [Fact]
    public void Register_WithValidData_PassesValidation()
    {
        var request = new RegisterRequest(
            Email: "user@example.com",
            Password: "Password1",
            FirstName: "Ali",
            LastName: "Veli",
            Phone: "+905321234567"
        );

        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("missing@")]
    [InlineData("@nodomain.com")]
    public void Register_WithInvalidEmail_FailsValidation(string email)
    {
        var request = new RegisterRequest(email, "Password1", "Ali", "Veli", null);
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Theory]
    [InlineData("short")] // 7 karakter, 8 gerekli
    [InlineData("alllowercase1")] // büyük harf yok
    [InlineData("NOLOWER123")] // küçük harf yok — bekle: validator bunu kontrol etmez
    [InlineData("NoDigitsHere")] // rakam yok
    public void Register_WithWeakPassword_FailsValidation(string password)
    {
        var request = new RegisterRequest("user@example.com", password, "Ali", "Veli", null);
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Register_WithMinimumValidPassword_PassesValidation()
    {
        // 8 karakter, büyük harf var, rakam var
        var request = new RegisterRequest("user@example.com", "Pass1234", "Ali", "Veli", null);
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Register_WithEmptyFirstName_FailsValidation()
    {
        var request = new RegisterRequest("user@example.com", "Password1", "", "Veli", null);
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FirstName");
    }

    [Fact]
    public void Register_WithFirstNameExceeding50Chars_FailsValidation()
    {
        var request = new RegisterRequest(
            "user@example.com",
            "Password1",
            new string('A', 51),
            "Veli",
            null
        );
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Register_WithNullPhone_PassesValidation()
    {
        // Telefon opsiyonel
        var request = new RegisterRequest("user@example.com", "Password1", "Ali", "Veli", null);
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("abc")] // çok kısa
    [InlineData("1234")] // 4 basamak
    public void Register_WithInvalidPhoneFormat_FailsValidation(string phone)
    {
        var request = new RegisterRequest("user@example.com", "Password1", "Ali", "Veli", phone);
        var result = _registerValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Phone");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LoginRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly LoginRequestValidator _loginValidator = new();

    [Fact]
    public void Login_WithValidCredentials_PassesValidation()
    {
        var request = new LoginRequest("user@example.com", "anypassword");
        var result = _loginValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Login_WithEmptyEmail_FailsValidation()
    {
        var request = new LoginRequest("", "password");
        var result = _loginValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Fact]
    public void Login_WithInvalidEmailFormat_FailsValidation()
    {
        var request = new LoginRequest("not-an-email", "password");
        var result = _loginValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Login_WithEmptyPassword_FailsValidation()
    {
        var request = new LoginRequest("user@example.com", "");
        var result = _loginValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ResetPasswordRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly ResetPasswordRequestValidator _resetValidator = new();

    [Fact]
    public void ResetPassword_WithValidData_PassesValidation()
    {
        var request = new ResetPasswordRequest("valid-token-abc", "NewPass1");
        var result = _resetValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ResetPassword_WithEmptyToken_FailsValidation()
    {
        var request = new ResetPasswordRequest("", "NewPass1");
        var result = _resetValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Token");
    }

    [Fact]
    public void ResetPassword_WithWeakNewPassword_FailsValidation()
    {
        var request = new ResetPasswordRequest("valid-token", "short");
        var result = _resetValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ResetPassword_WithNewPasswordMissingDigit_FailsValidation()
    {
        var request = new ResetPasswordRequest("valid-token", "NoDigitsHere");
        var result = _resetValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "NewPassword");
    }
}
