using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Order must contain at least one item.")
            .Must(items => items.Count <= 50)
            .WithMessage("A single order cannot contain more than 50 items.");

        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemValidator());

        RuleFor(x => x.ShippingAddress).SetValidator(new ShippingAddressValidator());

        RuleFor(x => x.ShippingRate)
            .Must(r => r == "EXPRESS" || r == "REGULAR")
            .WithMessage("Shipping rate must be EXPRESS or REGULAR.");

        RuleFor(x => x.Source)
            .Must(s => s == "MARKETPLACE" || s == "ESTORE")
            .WithMessage("Order source must be MARKETPLACE or ESTORE.");
    }
}

public class CreateOrderItemValidator : AbstractValidator<CreateOrderItemDto>
{
    public CreateOrderItemValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("Product ID is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Quantity must be greater than 0.")
            .LessThanOrEqualTo(999)
            .WithMessage("Quantity cannot exceed 999.");
    }
}

public class ShippingAddressValidator : AbstractValidator<ShippingAddressDto>
{
    public ShippingAddressValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Full name is required.")
            .MaximumLength(100)
            .WithMessage("Full name cannot exceed 100 characters.");

        RuleFor(x => x.Phone)
            .NotEmpty()
            .WithMessage("Phone number is required.")
            .Matches(@"^(\+90|0)?[5][0-9]{9}$")
            .WithMessage("Please enter a valid phone number.");

        RuleFor(x => x.AddressLine)
            .NotEmpty()
            .WithMessage("Address line is required.")
            .MaximumLength(250)
            .WithMessage("Address cannot exceed 250 characters.");

        RuleFor(x => x.City).NotEmpty().WithMessage("City is required.").MaximumLength(50);

        RuleFor(x => x.District).NotEmpty().WithMessage("District is required.").MaximumLength(50);

        RuleFor(x => x.PostalCode)
            .NotEmpty()
            .WithMessage("Postal code is required.")
            .Matches(@"^\d{5}$")
            .WithMessage("Postal code must be 5 digits.");
    }
}

public class UpdateOrderStatusValidator : AbstractValidator<UpdateOrderStatusDto>
{
    private static readonly string[] ValidStatuses =
    [
        "PENDING",
        "PAYMENT_CONFIRMED",
        "LABEL_GENERATED",
        "COURIER_ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
    ];

    public UpdateOrderStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .WithMessage("Status is required.")
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage($"Invalid status. Valid values: {string.Join(", ", ValidStatuses)}");
    }
}
