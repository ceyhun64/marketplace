using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Merchants;

// ── Request ───────────────────────────────────────────────────────────────────
public record CreateMerchantCommand(
    string Name,
    string Email,
    string Password,
    string StoreName,
    string? Phone = null
) : IRequest<CreateMerchantResult>;

// ── Result ────────────────────────────────────────────────────────────────────
public record CreateMerchantResult(Guid UserId, Guid MerchantId, string StoreName, string Slug);

// ── Handler ───────────────────────────────────────────────────────────────────
public class CreateMerchantCommandHandler
    : IRequestHandler<CreateMerchantCommand, CreateMerchantResult>
{
    private readonly AppDbContext _db;

    public CreateMerchantCommandHandler(AppDbContext db) => _db = db;

    public async Task<CreateMerchantResult> Handle(
        CreateMerchantCommand request,
        CancellationToken cancellationToken
    )
    {
        bool emailExists = await _db.Users.AnyAsync(
            u => u.Email == request.Email,
            cancellationToken
        );

        if (emailExists)
            throw new InvalidOperationException("Bu e-posta adresi zaten kullanımda.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Merchant,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow,
        };

        var slug = GenerateSlug(request.StoreName);

        // Slug çakışması durumunda sayı ekle
        int suffix = 1;
        var baseSlug = slug;
        while (await _db.MerchantProfiles.AnyAsync(m => m.Slug == slug, cancellationToken))
            slug = $"{baseSlug}-{suffix++}";

        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StoreName = request.StoreName,
            Slug = slug,
            HandlingHours = 24,
        };

        _db.Users.Add(user);
        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateMerchantResult(user.Id, merchant.Id, merchant.StoreName, merchant.Slug);
    }

    private static string GenerateSlug(string name) =>
        name.ToLowerInvariant()
            .Replace("ğ", "g")
            .Replace("ü", "u")
            .Replace("ş", "s")
            .Replace("ı", "i")
            .Replace("ö", "o")
            .Replace("ç", "c")
            .Replace(" ", "-")
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .Aggregate(string.Empty, (acc, c) => acc + c)
            .Trim('-');
}
