using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class AssignCourierDtoValidator : AbstractValidator<AssignCourierDto>
{
    public AssignCourierDtoValidator()
    {
        RuleFor(x => x.ShipmentId)
            .NotEmpty().WithMessage("ShipmentId zorunludur.");

        RuleFor(x => x.CourierId)
            .NotEmpty().WithMessage("CourierId zorunludur.");
    }
}

public class UpdateShipmentStatusDtoValidator : AbstractValidator<UpdateShipmentStatusDto>
{
    private static readonly string[] ValidStatuses =
    [
        "Pending", "LabelGenerated", "CourierAssigned",
        "PickedUp", "InTransit", "OutForDelivery", "Delivered", "Failed"
    ];

    public UpdateShipmentStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Durum zorunludur.")
            .Must(s => ValidStatuses.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage(
                $"Geçersiz durum. Geçerli değerler: {string.Join(", ", ValidStatuses)}"
            );

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Not en fazla 500 karakter olabilir.")
            .When(x => x.Note != null);
    }
}

public class PickupConfirmDtoValidator : AbstractValidator<PickupConfirmDto>
{
    public PickupConfirmDtoValidator()
    {
        RuleFor(x => x.Signature)
            .MaximumLength(200).WithMessage("İmza bilgisi en fazla 200 karakter olabilir.")
            .When(x => x.Signature != null);
    }
}

public class DeliveredConfirmDtoValidator : AbstractValidator<DeliveredConfirmDto>
{
    public DeliveredConfirmDtoValidator()
    {
        RuleFor(x => x.RecipientName)
            .MaximumLength(150).WithMessage("Alıcı adı en fazla 150 karakter olabilir.")
            .When(x => x.RecipientName != null);

        RuleFor(x => x.PhotoUrl)
            .Must(url => url == null || Uri.IsWellFormedUriString(url, UriKind.Absolute))
            .WithMessage("Fotoğraf URL'si geçerli bir URI olmalıdır.")
            .When(x => x.PhotoUrl != null);
    }
}
