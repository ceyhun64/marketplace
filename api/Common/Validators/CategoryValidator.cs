using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MinimumLength(2).WithMessage("Category name must be at least 2 characters.")
            .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(100).WithMessage("Slug cannot exceed 100 characters.")
            .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug can only contain lowercase letters, digits, and hyphens (e.g. 'electronics').");

        When(x => x.IconUrl is not null, () =>
        {
            RuleFor(x => x.IconUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Invalid icon URL format.");
        });

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Sort order cannot be negative.");
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name)
                .MinimumLength(2).WithMessage("Category name must be at least 2 characters.")
                .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters.");
        });

        When(x => x.Slug is not null, () =>
        {
            RuleFor(x => x.Slug)
                .MaximumLength(100).WithMessage("Slug cannot exceed 100 characters.")
                .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
                .WithMessage("Slug can only contain lowercase letters, digits, and hyphens.");
        });

        When(x => x.IconUrl is not null, () =>
        {
            RuleFor(x => x.IconUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Invalid icon URL format.");
        });

        When(x => x.SortOrder.HasValue, () =>
        {
            RuleFor(x => x.SortOrder!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Sort order cannot be negative.");
        });
    }
}
