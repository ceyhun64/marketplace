using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreatePluginValidator : AbstractValidator<CreatePluginDto>
{
    private static readonly string[] ValidCategories =
    {
        "SEO",
        "Analytics",
        "Chat",
        "Marketing",
        "Accounting",
        "Shipping",
        "Other",
    };

    private static readonly string[] ValidPlans = { "Basic", "Pro", "Enterprise" };

    public CreatePluginValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Plugin name is required.")
            .MaximumLength(100)
            .WithMessage("Plugin name cannot exceed 100 characters.");

        RuleFor(x => x.Slug)
            .NotEmpty()
            .WithMessage("Slug is required.")
            .MaximumLength(80)
            .WithMessage("Slug cannot exceed 80 characters.")
            .Matches(@"^[a-z0-9\-]+$")
            .WithMessage("Slug can only contain lowercase letters, digits, and hyphens.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters.");

        RuleFor(x => x.Category)
            .Must(c => ValidCategories.Contains(c))
            .WithMessage($"Valid categories: {string.Join(", ", ValidCategories)}");

        RuleFor(x => x.MonthlyPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Monthly price must be 0 or greater.");

        RuleFor(x => x.MinimumPlan)
            .Must(p => ValidPlans.Contains(p))
            .WithMessage($"Valid plans: {string.Join(", ", ValidPlans)}");

        RuleFor(x => x.DocumentationUrl)
            .Must(url => url == null || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Please enter a valid documentation URL.");

        RuleFor(x => x.DeveloperName)
            .MaximumLength(100)
            .WithMessage("Developer name cannot exceed 100 characters.")
            .When(x => x.DeveloperName != null);
    }
}

public class UpdatePluginConfigValidator : AbstractValidator<UpdatePluginConfigDto>
{
    public UpdatePluginConfigValidator()
    {
        RuleFor(x => x.Config)
            .MaximumLength(4000)
            .WithMessage("Config JSON cannot exceed 4000 characters.")
            .When(x => x.Config != null);
    }
}
