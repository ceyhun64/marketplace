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
            .WithMessage("Plan type is required.")
            .Must(p => ValidPlans.Contains(p))
            .WithMessage($"Valid plan types: {string.Join(", ", ValidPlans)}");

        RuleFor(x => x.PaymentToken)
            .MaximumLength(500)
            .WithMessage("Payment token cannot exceed 500 characters.")
            .When(x => x.PaymentToken != null);
    }
}
