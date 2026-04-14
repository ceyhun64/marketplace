// ─────────────────────────────────────────────────────────────────────────────
// api/Common/Validators/AuthValidators.cs
// ─────────────────────────────────────────────────────────────────────────────
using api.Common.DTOs.Auth;
using FluentValidation;

namespace api.Common.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("E-posta boş olamaz.")
            .EmailAddress()
            .WithMessage("Geçerli bir e-posta adresi girin.")
            .MaximumLength(200);

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Şifre boş olamaz.")
            .MinimumLength(8)
            .WithMessage("Şifre en az 8 karakter olmalı.")
            .MaximumLength(100)
            .Matches("[A-Z]")
            .WithMessage("Şifre en az bir büyük harf içermeli.")
            .Matches("[0-9]")
            .WithMessage("Şifre en az bir rakam içermeli.");

        RuleFor(x => x.FirstName).NotEmpty().WithMessage("Ad boş olamaz.").MaximumLength(50);

        RuleFor(x => x.LastName).NotEmpty().WithMessage("Soyad boş olamaz.").MaximumLength(50);

        RuleFor(x => x.Phone)
            .Matches(@"^\+?[0-9\s\-]{7,20}$")
            .WithMessage("Geçerli bir telefon numarası girin.")
            .When(x => !string.IsNullOrEmpty(x.Phone));
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("E-posta boş olamaz.")
            .EmailAddress()
            .WithMessage("Geçerli bir e-posta adresi girin.");

        RuleFor(x => x.Password).NotEmpty().WithMessage("Şifre boş olamaz.");
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("Token boş olamaz.");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("Yeni şifre boş olamaz.")
            .MinimumLength(8)
            .WithMessage("Şifre en az 8 karakter olmalı.")
            .Matches("[A-Z]")
            .WithMessage("Şifre en az bir büyük harf içermeli.")
            .Matches("[0-9]")
            .WithMessage("Şifre en az bir rakam içermeli.");
    }
}
