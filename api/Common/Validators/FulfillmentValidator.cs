using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class AssignCourierDtoValidator : AbstractValidator<AssignCourierDto>
{
    public AssignCourierDtoValidator()
    {
        RuleFor(x => x.ShipmentId)
            .NotEmpty().WithMessage("ShipmentId is required.");

        RuleFor(x => x.CourierId)
            .NotEmpty().WithMessage("CourierId is required.");
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
            .NotEmpty().WithMessage("Status is required.")
            .Must(s => ValidStatuses.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage(
                $"Invalid status. Valid values: {string.Join(", ", ValidStatuses)}"
            );

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Note cannot exceed 500 characters.")
            .When(x => x.Note != null);
    }
}

public class PickupConfirmDtoValidator : AbstractValidator<PickupConfirmDto>
{
    public PickupConfirmDtoValidator()
    {
        RuleFor(x => x.Signature)
            .MaximumLength(200).WithMessage("Signature cannot exceed 200 characters.")
            .When(x => x.Signature != null);
    }
}

public class DeliveredConfirmDtoValidator : AbstractValidator<DeliveredConfirmDto>
{
    public DeliveredConfirmDtoValidator()
    {
        RuleFor(x => x.RecipientName)
            .MaximumLength(150).WithMessage("Recipient name cannot exceed 150 characters.")
            .When(x => x.RecipientName != null);

        RuleFor(x => x.PhotoUrl)
            .Must(url => url == null || Uri.IsWellFormedUriString(url, UriKind.Absolute))
            .WithMessage("Photo URL must be a valid URI.")
            .When(x => x.PhotoUrl != null);
    }
}
