using api.Common.DTOs;
using api.Common.Validators;
using FluentAssertions;
using Xunit;

namespace api.Tests.Validators;

/// <summary>
/// FulfillmentValidator (AssignCourier, UpdateShipmentStatus, PickupConfirm, DeliveredConfirm)
/// ve SubscriptionValidator (SubscribeRequest) testleri.
/// </summary>
public class FulfillmentValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AssignCourierDtoValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly AssignCourierDtoValidator _assignValidator = new();

    [Fact]
    public void AssignCourier_WithValidData_PassesValidation()
    {
        var dto = new AssignCourierDto { ShipmentId = Guid.NewGuid(), CourierId = Guid.NewGuid() };
        var result = _assignValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void AssignCourier_WithEmptyShipmentId_FailsValidation()
    {
        var dto = new AssignCourierDto { ShipmentId = Guid.Empty, CourierId = Guid.NewGuid() };
        var result = _assignValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ShipmentId");
    }

    [Fact]
    public void AssignCourier_WithEmptyCourierId_FailsValidation()
    {
        var dto = new AssignCourierDto { ShipmentId = Guid.NewGuid(), CourierId = Guid.Empty };
        var result = _assignValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "CourierId");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateShipmentStatusDtoValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly UpdateShipmentStatusDtoValidator _statusValidator = new();

    [Theory]
    [InlineData("Pending")]
    [InlineData("LabelGenerated")]
    [InlineData("CourierAssigned")]
    [InlineData("PickedUp")]
    [InlineData("InTransit")]
    [InlineData("OutForDelivery")]
    [InlineData("Delivered")]
    [InlineData("Failed")]
    public void UpdateShipmentStatus_WithValidStatus_PassesValidation(string status)
    {
        var dto = new UpdateShipmentStatusDto { Status = status };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeTrue(because: $"'{status}' geçerli bir shipment durumudur");
    }

    [Theory]
    [InlineData("PENDING")] // UPPER_SNAKE_CASE — geçersiz (PascalCase bekleniyor)
    [InlineData("IN_TRANSIT")] // underscore — geçersiz
    [InlineData("")]
    [InlineData("InvalidStatus")]
    public void UpdateShipmentStatus_WithInvalidStatus_FailsValidation(string status)
    {
        var dto = new UpdateShipmentStatusDto { Status = status };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeFalse(because: $"'{status}' geçersiz shipment statüsüdür");
    }

    [Fact]
    public void UpdateShipmentStatus_WithNoteOver500Chars_FailsValidation()
    {
        var dto = new UpdateShipmentStatusDto { Status = "InTransit", Note = new string('X', 501) };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Note");
    }

    [Fact]
    public void UpdateShipmentStatus_WithNullNote_PassesValidation()
    {
        var dto = new UpdateShipmentStatusDto { Status = "Delivered", Note = null };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateShipmentStatus_WithExactly500CharNote_PassesValidation()
    {
        var dto = new UpdateShipmentStatusDto
        {
            Status = "InTransit",
            Note = new string('N', 500), // sınır değer — geçerli
        };
        var result = _statusValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DeliveredConfirmDtoValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly DeliveredConfirmDtoValidator _deliveredValidator = new();

    [Fact]
    public void DeliveredConfirm_WithNullFields_PassesValidation()
    {
        var dto = new DeliveredConfirmDto { RecipientName = null, PhotoUrl = null };
        var result = _deliveredValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void DeliveredConfirm_WithValidPhotoUrl_PassesValidation()
    {
        var dto = new DeliveredConfirmDto
        {
            RecipientName = "Ali Veli",
            PhotoUrl = "https://cdn.example.com/delivery.jpg",
        };
        var result = _deliveredValidator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void DeliveredConfirm_WithInvalidPhotoUrl_FailsValidation()
    {
        var dto = new DeliveredConfirmDto { PhotoUrl = "not-a-url" };
        var result = _deliveredValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PhotoUrl");
    }

    [Fact]
    public void DeliveredConfirm_WithRecipientNameOver150Chars_FailsValidation()
    {
        var dto = new DeliveredConfirmDto { RecipientName = new string('A', 151) };
        var result = _deliveredValidator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "RecipientName");
    }
}

public class SubscriptionValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // SubscribeRequestValidator
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly SubscribeRequestValidator _validator = new();

    [Theory]
    [InlineData("Basic")]
    [InlineData("Pro")]
    [InlineData("Enterprise")]
    public void Subscribe_WithValidPlanType_PassesValidation(string plan)
    {
        var dto = new SubscribeRequestDto { PlanType = plan };
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeTrue(because: $"'{plan}' geçerli bir plan tipidir");
    }

    [Theory]
    [InlineData("")]
    [InlineData("BASIC")] // büyük harf — geçersiz
    [InlineData("Starter")]
    [InlineData("premium")]
    public void Subscribe_WithInvalidPlanType_FailsValidation(string plan)
    {
        var dto = new SubscribeRequestDto { PlanType = plan };
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse(because: $"'{plan}' geçersiz plan tipidir");
        result.Errors.Should().Contain(e => e.PropertyName == "PlanType");
    }

    [Fact]
    public void Subscribe_WithPaymentTokenOver500Chars_FailsValidation()
    {
        var dto = new SubscribeRequestDto { PlanType = "Pro", PaymentToken = new string('T', 501) };
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PaymentToken");
    }

    [Fact]
    public void Subscribe_WithNullPaymentToken_PassesValidation()
    {
        var dto = new SubscribeRequestDto { PlanType = "Basic", PaymentToken = null };
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }
}
