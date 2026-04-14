// ─────────────────────────────────────────────────────────────────────────────
// api/Common/DTOs/Auth/AuthDTOs.cs
// ─────────────────────────────────────────────────────────────────────────────
using System.ComponentModel.DataAnnotations;

namespace api.Common.DTOs.Auth;

// ── REQUEST DTOs ──────────────────────────────────────────────────────────────

public sealed record RegisterRequest(
    [Required] [EmailAddress] string Email,
    [Required] [MinLength(8)] string Password,
    [Required] [MaxLength(50)] string FirstName,
    [Required] [MaxLength(50)] string LastName,
    [Phone] string? Phone
);

public sealed record LoginRequest(
    [Required] [EmailAddress] string Email,
    [Required] string Password
);

public sealed record RefreshTokenRequest([Required] string RefreshToken);

public sealed record ForgotPasswordRequest([Required] [EmailAddress] string Email);

public sealed record ResetPasswordRequest(
    [Required] string Token,
    [Required] [MinLength(8)] string NewPassword
);

public sealed record VerifyEmailRequest([Required] string Token);

// ── RESPONSE DTOs ─────────────────────────────────────────────────────────────

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserInfoResponse User
);

public sealed record UserInfoResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? Phone,
    string Role,
    bool IsVerified,
    Guid? MerchantId
);

public sealed record RefreshTokenResponse(string AccessToken, DateTime ExpiresAt);

public sealed record MessageResponse(string Message, bool Success = true);
