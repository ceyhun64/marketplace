// ─────────────────────────────────────────────────────────────────────────────
// api/Infrastructure/Services/ITokenService.cs
// ─────────────────────────────────────────────────────────────────────────────
using api.Domain.Entities;

namespace api.Infrastructure.Services;

public interface ITokenService
{
    /// <summary>Kullanıcı için JWT access token üretir.</summary>
    string GenerateAccessToken(User user);

    /// <summary>Cryptographically secure refresh token üretir.</summary>
    string GenerateRefreshToken();

    /// <summary>Süresi dolmamış JWT'den UserId'yi çıkarır.</summary>
    Guid? GetUserIdFromToken(string token);
}
