using api.Common.DTOs;
using FluentValidation;

namespace api.Common.Validators;

public class SubscribeRequestValidator : AbstractValidator<SubscribeRequestDto>
{
    private static readonly string[] ValidPlans = { "Basic", "Pro", "Enterprise" };

    public SubscribeRequestValidator()
    {
        RuleFor(x => x.PlanType)
            .NotEmpty()
            .WithMessage("Plan tipi zorunludur.")
            .Must(p => ValidPlans.Contains(p))
            .WithMessage($"Geçerli plan tipleri: {string.Join(", ", ValidPlans)}");

        RuleFor(x => x.PaymentToken)
            .MaximumLength(500)
            .WithMessage("Ödeme token'ı en fazla 500 karakter olabilir.")
            .When(x => x.PaymentToken != null);
    }
}
