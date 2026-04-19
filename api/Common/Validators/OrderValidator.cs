using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Sipariş en az bir ürün içermelidir.")
            .Must(items => items.Count <= 50)
            .WithMessage("Tek siparişte en fazla 50 ürün olabilir.");

        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemValidator());

        RuleFor(x => x.ShippingAddress).SetValidator(new ShippingAddressValidator());

        RuleFor(x => x.ShippingRate)
            .Must(r => r == "EXPRESS" || r == "REGULAR")
            .WithMessage("Kargo tipi EXPRESS veya REGULAR olmalıdır.");

        RuleFor(x => x.Source)
            .Must(s => s == "MARKETPLACE" || s == "ESTORE")
            .WithMessage("Sipariş kaynağı MARKETPLACE veya ESTORE olmalıdır.");
    }
}

public class CreateOrderItemValidator : AbstractValidator<CreateOrderItemDto>
{
    public CreateOrderItemValidator()
    {
        RuleFor(x => x.OfferId).NotEmpty().WithMessage("Teklif ID boş olamaz.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Miktar 0'dan büyük olmalıdır.")
            .LessThanOrEqualTo(999)
            .WithMessage("Miktar 999'dan fazla olamaz.");
    }
}

public class ShippingAddressValidator : AbstractValidator<ShippingAddressDto>
{
    public ShippingAddressValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Ad soyad boş olamaz.")
            .MaximumLength(100)
            .WithMessage("Ad soyad 100 karakterden uzun olamaz.");

        RuleFor(x => x.Phone)
            .NotEmpty()
            .WithMessage("Telefon boş olamaz.")
            .Matches(@"^(\+90|0)?[5][0-9]{9}$")
            .WithMessage("Geçerli bir Türkiye telefon numarası giriniz.");

        RuleFor(x => x.AddressLine)
            .NotEmpty()
            .WithMessage("Adres satırı boş olamaz.")
            .MaximumLength(250)
            .WithMessage("Adres 250 karakterden uzun olamaz.");

        RuleFor(x => x.City).NotEmpty().WithMessage("Şehir boş olamaz.").MaximumLength(50);

        RuleFor(x => x.District).NotEmpty().WithMessage("İlçe boş olamaz.").MaximumLength(50);

        RuleFor(x => x.PostalCode)
            .NotEmpty()
            .WithMessage("Posta kodu boş olamaz.")
            .Matches(@"^\d{5}$")
            .WithMessage("Posta kodu 5 haneli olmalıdır.");
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
            .WithMessage("Durum boş olamaz.")
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage($"Geçersiz durum. Geçerli değerler: {string.Join(", ", ValidStatuses)}");
    }
}
