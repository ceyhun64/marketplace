using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateMerchantRequestValidator : AbstractValidator<CreateMerchantRequest>
{
    public CreateMerchantRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta zorunludur.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.")
            .MaximumLength(256).WithMessage("E-posta en fazla 256 karakter olabilir.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur.")
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalıdır.")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir.")
            .Matches(@"[0-9]").WithMessage("Şifre en az bir rakam içermelidir.");

        RuleFor(x => x.StoreName)
            .NotEmpty().WithMessage("Mağaza adı zorunludur.")
            .MinimumLength(2).WithMessage("Mağaza adı en az 2 karakter olmalıdır.")
            .MaximumLength(100).WithMessage("Mağaza adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug zorunludur.")
            .MaximumLength(100).WithMessage("Slug en fazla 100 karakter olabilir.")
            .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug yalnızca küçük harf, rakam ve tire içerebilir.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Geçersiz enlem değeri (-90 ile 90 arası).");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Geçersiz boylam değeri (-180 ile 180 arası).");

        RuleFor(x => x.HandlingHours)
            .GreaterThan(0).WithMessage("Hazırlık süresi 0'dan büyük olmalıdır.")
            .LessThanOrEqualTo(168).WithMessage("Hazırlık süresi en fazla 168 saat (1 hafta) olabilir.");

        When(x => x.PhoneNumber is not null, () =>
        {
            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+?[1-9]\d{7,14}$")
                .WithMessage("Geçerli bir telefon numarası giriniz.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Mağaza açıklaması en fazla 1000 karakter olabilir.");
        });

        When(x => x.LogoUrl is not null, () =>
        {
            RuleFor(x => x.LogoUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Geçersiz logo URL formatı.");
        });

        When(x => x.BannerUrl is not null, () =>
        {
            RuleFor(x => x.BannerUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("Geçersiz banner URL formatı.");
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
                .MinimumLength(2).WithMessage("Mağaza adı en az 2 karakter olmalıdır.")
                .MaximumLength(100).WithMessage("Mağaza adı en fazla 100 karakter olabilir.");
        });

        When(x => x.Latitude.HasValue, () =>
        {
            RuleFor(x => x.Latitude!.Value)
                .InclusiveBetween(-90, 90).WithMessage("Geçersiz enlem değeri.");
        });

        When(x => x.Longitude.HasValue, () =>
        {
            RuleFor(x => x.Longitude!.Value)
                .InclusiveBetween(-180, 180).WithMessage("Geçersiz boylam değeri.");
        });

        When(x => x.HandlingHours.HasValue, () =>
        {
            RuleFor(x => x.HandlingHours!.Value)
                .GreaterThan(0).WithMessage("Hazırlık süresi 0'dan büyük olmalıdır.")
                .LessThanOrEqualTo(168).WithMessage("Hazırlık süresi en fazla 168 saat olabilir.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Açıklama en fazla 1000 karakter olabilir.");
        });

        When(x => x.PhoneNumber is not null, () =>
        {
            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+?[1-9]\d{7,14}$")
                .WithMessage("Geçerli bir telefon numarası giriniz.");
        });
    }
}
