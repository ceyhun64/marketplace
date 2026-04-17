using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Kategori adı zorunludur.")
            .MinimumLength(2).WithMessage("Kategori adı en az 2 karakter olmalıdır.")
            .MaximumLength(100).WithMessage("Kategori adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug zorunludur.")
            .MaximumLength(100).WithMessage("Slug en fazla 100 karakter olabilir.")
            .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug yalnızca küçük harf, rakam ve tire içerebilir (örn: 'elektronik-urunler').");

        When(x => x.IconUrl is not null, () =>
        {
            RuleFor(x => x.IconUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Geçersiz ikon URL formatı.");
        });

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Sıralama değeri negatif olamaz.");
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name)
                .MinimumLength(2).WithMessage("Kategori adı en az 2 karakter olmalıdır.")
                .MaximumLength(100).WithMessage("Kategori adı en fazla 100 karakter olabilir.");
        });

        When(x => x.Slug is not null, () =>
        {
            RuleFor(x => x.Slug)
                .MaximumLength(100).WithMessage("Slug en fazla 100 karakter olabilir.")
                .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
                .WithMessage("Slug yalnızca küçük harf, rakam ve tire içerebilir.");
        });

        When(x => x.IconUrl is not null, () =>
        {
            RuleFor(x => x.IconUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Geçersiz ikon URL formatı.");
        });

        When(x => x.SortOrder.HasValue, () =>
        {
            RuleFor(x => x.SortOrder!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Sıralama değeri negatif olamaz.");
        });
    }
}
