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
            .WithMessage("Plugin adı zorunludur.")
            .MaximumLength(100)
            .WithMessage("Plugin adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.Slug)
            .NotEmpty()
            .WithMessage("Slug zorunludur.")
            .MaximumLength(80)
            .WithMessage("Slug en fazla 80 karakter olabilir.")
            .Matches(@"^[a-z0-9\-]+$")
            .WithMessage("Slug yalnızca küçük harf, rakam ve tire içerebilir.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Açıklama zorunludur.")
            .MaximumLength(500)
            .WithMessage("Açıklama en fazla 500 karakter olabilir.");

        RuleFor(x => x.Category)
            .Must(c => ValidCategories.Contains(c))
            .WithMessage($"Geçerli kategoriler: {string.Join(", ", ValidCategories)}");

        RuleFor(x => x.MonthlyPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Aylık ücret 0 veya üzeri olmalıdır.");

        RuleFor(x => x.MinimumPlan)
            .Must(p => ValidPlans.Contains(p))
            .WithMessage($"Geçerli planlar: {string.Join(", ", ValidPlans)}");

        RuleFor(x => x.DocumentationUrl)
            .Must(url => url == null || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Geçerli bir dokümantasyon URL'si giriniz.");

        RuleFor(x => x.DeveloperName)
            .MaximumLength(100)
            .WithMessage("Geliştirici adı en fazla 100 karakter olabilir.")
            .When(x => x.DeveloperName != null);
    }
}

public class UpdatePluginConfigValidator : AbstractValidator<UpdatePluginConfigDto>
{
    public UpdatePluginConfigValidator()
    {
        RuleFor(x => x.Config)
            .MaximumLength(4000)
            .WithMessage("Config JSON en fazla 4000 karakter olabilir.")
            .When(x => x.Config != null);
    }
}
