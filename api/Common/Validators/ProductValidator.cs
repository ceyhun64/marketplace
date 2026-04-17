using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı zorunludur.")
            .MinimumLength(3).WithMessage("Ürün adı en az 3 karakter olmalıdır.")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Ürün açıklaması zorunludur.")
            .MinimumLength(10).WithMessage("Açıklama en az 10 karakter olmalıdır.")
            .MaximumLength(5000).WithMessage("Açıklama en fazla 5000 karakter olabilir.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Kategori seçimi zorunludur.");

        RuleFor(x => x.Images)
            .NotNull().WithMessage("Görsel listesi boş olamaz.")
            .Must(imgs => imgs.Count >= 1).WithMessage("En az 1 ürün görseli eklenmelidir.")
            .Must(imgs => imgs.Count <= 10).WithMessage("En fazla 10 görsel eklenebilir.");

        RuleForEach(x => x.Images)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Geçersiz görsel URL formatı.");

        RuleFor(x => x.Tags)
            .NotNull()
            .Must(tags => tags.Count <= 20).WithMessage("En fazla 20 etiket eklenebilir.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name)
                .MinimumLength(3).WithMessage("Ürün adı en az 3 karakter olmalıdır.")
                .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description)
                .MinimumLength(10).WithMessage("Açıklama en az 10 karakter olmalıdır.")
                .MaximumLength(5000).WithMessage("Açıklama en fazla 5000 karakter olabilir.");
        });

        When(x => x.Images is not null, () =>
        {
            RuleFor(x => x.Images)
                .Must(imgs => imgs!.Count >= 1).WithMessage("En az 1 görsel olmalıdır.")
                .Must(imgs => imgs!.Count <= 10).WithMessage("En fazla 10 görsel olabilir.");
        });

        When(x => x.Tags is not null, () =>
        {
            RuleFor(x => x.Tags)
                .Must(tags => tags!.Count <= 20).WithMessage("En fazla 20 etiket olabilir.");
        });
    }
}

public class CreateOfferRequestValidator : AbstractValidator<CreateOfferRequest>
{
    public CreateOfferRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün ID zorunludur.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Fiyat 0'dan büyük olmalıdır.")
            .LessThanOrEqualTo(999_999.99m).WithMessage("Geçersiz fiyat değeri.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stok negatif olamaz.")
            .LessThanOrEqualTo(100_000).WithMessage("Maksimum stok 100.000 adettir.");
    }
}

public class UpdateOfferRequestValidator : AbstractValidator<UpdateOfferRequest>
{
    public UpdateOfferRequestValidator()
    {
        When(x => x.Price.HasValue, () =>
        {
            RuleFor(x => x.Price!.Value)
                .GreaterThan(0).WithMessage("Fiyat 0'dan büyük olmalıdır.")
                .LessThanOrEqualTo(999_999.99m).WithMessage("Geçersiz fiyat değeri.");
        });

        When(x => x.Stock.HasValue, () =>
        {
            RuleFor(x => x.Stock!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Stok negatif olamaz.")
                .LessThanOrEqualTo(100_000).WithMessage("Maksimum stok 100.000 adettir.");
        });
    }
}
