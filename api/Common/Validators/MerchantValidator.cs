using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateMerchantRequestValidator : AbstractValidator<CreateMerchantRequest>
{
    public CreateMerchantRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Please enter a valid email address.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one digit.");

        RuleFor(x => x.StoreName)
            .NotEmpty().WithMessage("Store name is required.")
            .MinimumLength(2).WithMessage("Store name must be at least 2 characters.")
            .MaximumLength(100).WithMessage("Store name cannot exceed 100 characters.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(100).WithMessage("Slug cannot exceed 100 characters.")
            .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug can only contain lowercase letters, digits, and hyphens.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Invalid latitude value (must be between -90 and 90).");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Invalid longitude value (must be between -180 and 180).");

        RuleFor(x => x.HandlingHours)
            .GreaterThan(0).WithMessage("Handling time must be greater than 0.")
            .LessThanOrEqualTo(168).WithMessage("Handling time cannot exceed 168 hours (1 week).");

        When(x => x.PhoneNumber is not null, () =>
        {
            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+?[1-9]\d{7,14}$")
                .WithMessage("Please enter a valid phone number.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Store description cannot exceed 1000 characters.");
        });

        When(x => x.LogoUrl is not null, () =>
        {
            RuleFor(x => x.LogoUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Invalid logo URL format.");
        });

        When(x => x.BannerUrl is not null, () =>
        {
            RuleFor(x => x.BannerUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Invalid banner URL format.");
        });
    }
}

public class UpdateMerchantProfileRequestValidator : AbstractValidator<UpdateMerchantProfileRequest>
{
    public UpdateMerchantProfileRequestValidator()
    {
        When(x => x.StoreName is not null, () =>
        {
            RuleFor(x => x.StoreName)
                .MinimumLength(2).WithMessage("Store name must be at least 2 characters.")
                .MaximumLength(100).WithMessage("Store name cannot exceed 100 characters.");
        });

        When(x => x.Latitude.HasValue, () =>
        {
            RuleFor(x => x.Latitude!.Value)
                .InclusiveBetween(-90, 90).WithMessage("Invalid latitude value.");
        });

        When(x => x.Longitude.HasValue, () =>
        {
            RuleFor(x => x.Longitude!.Value)
                .InclusiveBetween(-180, 180).WithMessage("Invalid longitude value.");
        });

        When(x => x.HandlingHours.HasValue, () =>
        {
            RuleFor(x => x.HandlingHours!.Value)
                .GreaterThan(0).WithMessage("Handling time must be greater than 0.")
                .LessThanOrEqualTo(168).WithMessage("Handling time cannot exceed 168 hours.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");
        });

        When(x => x.PhoneNumber is not null, () =>
        {
            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+?[1-9]\d{7,14}$")
                .WithMessage("Please enter a valid phone number.");
        });
    }
}
