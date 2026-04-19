using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateOfferValidator : AbstractValidator<CreateOfferDto>
{
    public CreateOfferValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün ID boş olamaz.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Fiyat 0'dan büyük olmalıdır.")
            .LessThan(1_000_000).WithMessage("Fiyat 1.000.000'dan küçük olmalıdır.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stok negatif olamaz.")
            .LessThan(100_000).WithMessage("Stok 100.000'den küçük olmalıdır.");
    }
}

public class UpdateOfferValidator : AbstractValidator<UpdateOfferDto>
{
    public UpdateOfferValidator()
    {
        When(x => x.Price.HasValue, () =>
        {
            RuleFor(x => x.Price!.Value)
                .GreaterThan(0).WithMessage("Fiyat 0'dan büyük olmalıdır.")
                .LessThan(1_000_000).WithMessage("Fiyat 1.000.000'dan küçük olmalıdır.");
        });

        When(x => x.Stock.HasValue, () =>
        {
            RuleFor(x => x.Stock!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Stok negatif olamaz.")
                .LessThan(100_000).WithMessage("Stok 100.000'den küçük olmalıdır.");
        });
    }
}

public class PublishOfferValidator : AbstractValidator<PublishOfferDto>
{
    public PublishOfferValidator()
    {
        // En az birinin true olması zorunlu değil, her ikisi de false olabilir (yayından kaldırma)
    }
}