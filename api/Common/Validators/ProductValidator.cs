using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MinimumLength(3).WithMessage("Product name must be at least 3 characters.")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Product description is required.")
            .MinimumLength(10).WithMessage("Description must be at least 10 characters.")
            .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters.");

        When(x => x.ShortDescription is not null, () =>
        {
            RuleFor(x => x.ShortDescription)
                .MaximumLength(500).WithMessage("Short description cannot exceed 500 characters.");
        });

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category selection is required.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.")
            .LessThanOrEqualTo(999_999.99m).WithMessage("Invalid price value.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.")
            .LessThanOrEqualTo(100_000).WithMessage("Maximum stock is 100,000 units.");

        RuleFor(x => x.Images)
            .NotNull().WithMessage("Image list cannot be empty.")
            .Must(imgs => imgs.Count >= 1).WithMessage("At least 1 product image is required.")
            .Must(imgs => imgs.Count <= 10).WithMessage("Cannot add more than 10 images.");

        RuleForEach(x => x.Images)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Invalid image URL format.");

        RuleFor(x => x.Tags)
            .NotNull()
            .Must(tags => tags.Count <= 20).WithMessage("Cannot add more than 20 tags.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name)
                .MinimumLength(3).WithMessage("Product name must be at least 3 characters.")
                .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description)
                .MinimumLength(10).WithMessage("Description must be at least 10 characters.")
                .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters.");
        });

        When(x => x.ShortDescription is not null, () =>
        {
            RuleFor(x => x.ShortDescription)
                .MaximumLength(500).WithMessage("Short description cannot exceed 500 characters.");
        });

        When(x => x.Images is not null, () =>
        {
            RuleFor(x => x.Images)
                .Must(imgs => imgs!.Count >= 1).WithMessage("At least 1 image is required.")
                .Must(imgs => imgs!.Count <= 10).WithMessage("Cannot add more than 10 images.");

            RuleForEach(x => x.Images)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Invalid image URL format.");
        });

        When(x => x.Tags is not null, () =>
        {
            RuleFor(x => x.Tags)
                .Must(tags => tags!.Count <= 20).WithMessage("Cannot add more than 20 tags.");
        });

        When(x => x.Price.HasValue, () =>
        {
            RuleFor(x => x.Price!.Value)
                .GreaterThan(0).WithMessage("Price must be greater than 0.")
                .LessThanOrEqualTo(999_999.99m).WithMessage("Invalid price value.");
        });

        When(x => x.Stock.HasValue, () =>
        {
            RuleFor(x => x.Stock!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.")
                .LessThanOrEqualTo(100_000).WithMessage("Maximum stock is 100,000 units.");
        });
    }
}

public class CreateOfferRequestValidator : AbstractValidator<CreateOfferRequest>
{
    public CreateOfferRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.")
            .LessThanOrEqualTo(999_999.99m).WithMessage("Invalid price value.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.")
            .LessThanOrEqualTo(100_000).WithMessage("Maximum stock is 100,000 units.");
    }
}

public class UpdateOfferRequestValidator : AbstractValidator<UpdateOfferRequest>
{
    public UpdateOfferRequestValidator()
    {
        When(x => x.Price.HasValue, () =>
        {
            RuleFor(x => x.Price!.Value)
                .GreaterThan(0).WithMessage("Price must be greater than 0.")
                .LessThanOrEqualTo(999_999.99m).WithMessage("Invalid price value.");
        });

        When(x => x.Stock.HasValue, () =>
        {
            RuleFor(x => x.Stock!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.")
                .LessThanOrEqualTo(100_000).WithMessage("Maximum stock is 100,000 units.");
        });
    }
}
