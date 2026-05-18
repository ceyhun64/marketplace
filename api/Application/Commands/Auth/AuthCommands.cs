using api.Common.DTOs.Auth;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace api.Application.Commands.Auth;

// ── Register ──────────────────────────────────────────────────────────────────

public record RegisterCommand(RegisterRequest Request) : IRequest<ServiceResult<AuthResponse>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, ServiceResult<AuthResponse>>
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly INotificationService _notification;
    private readonly IConfiguration _config;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        AppDbContext db,
        ITokenService tokenService,
        INotificationService notification,
        IConfiguration config,
        ILogger<RegisterCommandHandler> logger
    )
    {
        _db = db;
        _tokenService = tokenService;
        _notification = notification;
        _config = config;
        _logger = logger;
    }

    public async Task<ServiceResult<AuthResponse>> Handle(
        RegisterCommand request,
        CancellationToken ct
    )
    {
        var req = request.Request;
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower(), ct))
            return ServiceResult<AuthResponse>.Fail("This email address is already in use.");

        var user = new User
        {
            Email = req.Email.ToLower().Trim(),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Phone = req.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.Customer,
            IsVerified = false,
            VerificationToken = Guid.NewGuid().ToString("N"),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("New user registered: {Email}", user.Email);

        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
        var verifyUrl = $"{frontendUrl}/auth/verify-email?token={user.VerificationToken}";

        _ = Task.Run(async () =>
        {
            try
            {
                await _notification.SendEmailAsync(
                    user.Email,
                    "Verify your email address",
                    $"Hi {user.FirstName},\n\nTo verify your account, click the link below:\n{verifyUrl}\n\nThis link is valid for 24 hours."
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email: {Email}", user.Email);
            }
        });

        var (accessToken, refreshToken, expiresAt) = await IssueTokens(user, ct);
        return ServiceResult<AuthResponse>.Ok(
            MapAuthResponse(user, accessToken, refreshToken, expiresAt)
        );
    }

    private async Task<(string, string, DateTime)> IssueTokens(User user, CancellationToken ct)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresDays = int.TryParse(_config["REFRESH_EXPIRES_DAYS"], out var d) ? d : 7;
        var expiresAt = DateTime.UtcNow.AddMinutes(
            int.TryParse(_config["JWT_EXPIRES_MINUTES"], out var m) ? m : 15
        );
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiresDays);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return (accessToken, refreshToken, expiresAt);
    }

    private static AuthResponse MapAuthResponse(
        User user,
        string access,
        string refresh,
        DateTime exp
    ) => new(access, refresh, exp, MapUserInfo(user));

    private static UserInfoResponse MapUserInfo(User user) =>
        new(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Phone,
            user.Role.ToString(),
            user.IsVerified,
            user.MerchantProfile?.Id
        );
}

// ── Login ─────────────────────────────────────────────────────────────────────

public record LoginCommand(LoginRequest Request) : IRequest<ServiceResult<AuthResponse>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, ServiceResult<AuthResponse>>
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        AppDbContext db,
        ITokenService tokenService,
        IConfiguration config,
        ILogger<LoginCommandHandler> logger
    )
    {
        _db = db;
        _tokenService = tokenService;
        _config = config;
        _logger = logger;
    }

    public async Task<ServiceResult<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken ct
    )
    {
        var req = request.Request;
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Email == req.Email.ToLower() && !u.IsDeleted, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt: {Email}", req.Email);
            return ServiceResult<AuthResponse>.Fail("Invalid email or password.");
        }

        // Account status check — suspended or rejected accounts cannot log in
        if (user.AccountStatus == AccountStatus.Suspended)
        {
            _logger.LogWarning("Suspended account login attempt: {Email}", user.Email);
            return ServiceResult<AuthResponse>.Fail(
                "Your account has been suspended. Please contact support.");
        }

        if (user.AccountStatus == AccountStatus.Rejected)
        {
            _logger.LogWarning("Rejected account login attempt: {Email}", user.Email);
            return ServiceResult<AuthResponse>.Fail(
                "Your account application has been rejected.");
        }

        if (user.AccountStatus == AccountStatus.PendingApproval)
        {
            _logger.LogWarning("Pending account login attempt: {Email}", user.Email);
            return ServiceResult<AuthResponse>.Fail(
                "Your account is pending approval. Please wait for the confirmation email.");
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresDays = int.TryParse(_config["REFRESH_EXPIRES_DAYS"], out var d) ? d : 7;
        var expiresAt = DateTime.UtcNow.AddMinutes(
            int.TryParse(_config["JWT_EXPIRES_MINUTES"], out var m) ? m : 15
        );
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiresDays);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("User logged in: {Email} [{Role}]", user.Email, user.Role);

        return ServiceResult<AuthResponse>.Ok(
            new AuthResponse(
                accessToken,
                refreshToken,
                expiresAt,
                new UserInfoResponse(
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.Phone,
                    user.Role.ToString(),
                    user.IsVerified,
                    user.MerchantProfile?.Id
                )
            )
        );
    }
}

// ── Logout ────────────────────────────────────────────────────────────────────

public record LogoutCommand(Guid UserId) : IRequest<ServiceResult<bool>>;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;

    public LogoutCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<bool>> Handle(LogoutCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync([request.UserId], ct);
        if (user is null)
            return ServiceResult<bool>.Fail("User not found.");

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ServiceResult<bool>.Ok(true);
    }
}

// ── ForgotPassword ────────────────────────────────────────────────────────────

public record ForgotPasswordCommand(string Email) : IRequest<ServiceResult<bool>>;

public class ForgotPasswordCommandHandler
    : IRequestHandler<ForgotPasswordCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notification;
    private readonly IConfiguration _config;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        AppDbContext db,
        INotificationService notification,
        IConfiguration config,
        ILogger<ForgotPasswordCommandHandler> logger
    )
    {
        _db = db;
        _notification = notification;
        _config = config;
        _logger = logger;
    }

    public async Task<ServiceResult<bool>> Handle(
        ForgotPasswordCommand request,
        CancellationToken ct
    )
    {
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Email == request.Email.ToLower() && !u.IsDeleted,
            ct
        );

        if (user is not null)
        {
            user.PasswordResetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetExpiry = DateTime.UtcNow.AddHours(2);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Password reset requested: {Email}", user.Email);

            var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
            var resetUrl = $"{frontendUrl}/auth/reset-password?token={user.PasswordResetToken}";
            _ = Task.Run(async () =>
            {
                try
                {
                    await _notification.SendEmailAsync(
                        user.Email,
                        "Password Reset Request",
                        $"Hi {user.FirstName},\n\nTo reset your password, click the link below:\n{resetUrl}\n\nThis link is valid for 2 hours."
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to send password reset email: {Email}",
                        user.Email
                    );
                }
            });
        }

        return ServiceResult<bool>.Ok(true); // security: always succeed
    }
}

// ── ResetPassword ─────────────────────────────────────────────────────────────

public record ResetPasswordCommand(string Token, string NewPassword)
    : IRequest<ServiceResult<bool>>;

public class ResetPasswordCommandHandler
    : IRequestHandler<ResetPasswordCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notification;
    private readonly ILogger<ResetPasswordCommandHandler> _logger;

    public ResetPasswordCommandHandler(
        AppDbContext db,
        INotificationService notification,
        ILogger<ResetPasswordCommandHandler> logger
    )
    {
        _db = db;
        _notification = notification;
        _logger = logger;
    }

    public async Task<ServiceResult<bool>> Handle(
        ResetPasswordCommand request,
        CancellationToken ct
    )
    {
        var user = await _db.Users.FirstOrDefaultAsync(
            u =>
                u.PasswordResetToken == request.Token
                && u.PasswordResetExpiry > DateTime.UtcNow
                && !u.IsDeleted,
            ct
        );

        if (user is null)
            return ServiceResult<bool>.Fail("Invalid or expired token.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        _ = Task.Run(async () =>
        {
            try
            {
                await _notification.SendEmailAsync(
                    user.Email,
                    "Your Password Has Been Changed",
                    $"Hi {user.FirstName},\n\nYour password has been updated successfully."
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send password change notification: {Email}",
                    user.Email
                );
            }
        });

        return ServiceResult<bool>.Ok(true);
    }
}

// ── VerifyEmail ───────────────────────────────────────────────────────────────

public record VerifyEmailCommand(string Token) : IRequest<ServiceResult<bool>>;

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;
    private readonly ILogger<VerifyEmailCommandHandler> _logger;

    public VerifyEmailCommandHandler(AppDbContext db, ILogger<VerifyEmailCommandHandler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ServiceResult<bool>> Handle(VerifyEmailCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.VerificationToken == request.Token && !u.IsDeleted,
            ct
        );

        if (user is null)
            return ServiceResult<bool>.Fail("Invalid verification token.");
        if (user.IsVerified)
            return ServiceResult<bool>.Ok(true);

        user.IsVerified = true;
        user.VerificationToken = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Email verified: {Email}", user.Email);
        return ServiceResult<bool>.Ok(true);
    }
}

// ── GetMe (Query) ─────────────────────────────────────────────────────────────

public record GetMeQuery(Guid UserId) : IRequest<ServiceResult<UserInfoResponse>>;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, ServiceResult<UserInfoResponse>>
{
    private readonly AppDbContext _db;

    public GetMeQueryHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<UserInfoResponse>> Handle(
        GetMeQuery request,
        CancellationToken ct
    )
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, ct);

        if (user is null)
            return ServiceResult<UserInfoResponse>.Fail("User not found.");

        return ServiceResult<UserInfoResponse>.Ok(
            new UserInfoResponse(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.Phone,
                user.Role.ToString(),
                user.IsVerified,
                user.MerchantProfile?.Id
            )
        );
    }
}

// ── RefreshToken (Command) ────────────────────────────────────────────────────

public record RefreshTokenCommand(string Token) : IRequest<ServiceResult<RefreshTokenResponse>>;

public class RefreshTokenCommandHandler
    : IRequestHandler<RefreshTokenCommand, ServiceResult<RefreshTokenResponse>>
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;

    public RefreshTokenCommandHandler(
        AppDbContext db,
        ITokenService tokenService,
        IConfiguration config
    )
    {
        _db = db;
        _tokenService = tokenService;
        _config = config;
    }

    public async Task<ServiceResult<RefreshTokenResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken ct
    )
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(
                u =>
                    u.RefreshToken == request.Token
                    && u.RefreshTokenExpiry > DateTime.UtcNow
                    && !u.IsDeleted,
                ct
            );

        if (user is null)
            return ServiceResult<RefreshTokenResponse>.Fail("Invalid or expired token.");

        var accessToken = _tokenService.GenerateAccessToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(
            int.TryParse(_config["JWT_EXPIRES_MINUTES"], out var m) ? m : 15
        );

        // Token rotation — old refresh token is invalidated, new token is issued
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var expiresDays = int.TryParse(_config["REFRESH_EXPIRES_DAYS"], out var d) ? d : 7;
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiresDays);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ServiceResult<RefreshTokenResponse>.Ok(
            new RefreshTokenResponse(accessToken, expiresAt, newRefreshToken)
        );
    }
}
