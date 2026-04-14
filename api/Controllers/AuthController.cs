// ─────────────────────────────────────────────────────────────────────────────
// api/Controllers/AuthController.cs
// ─────────────────────────────────────────────────────────────────────────────
using api.Common.DTOs.Auth;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ICurrentUserService _currentUser;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AppDbContext db,
        ITokenService tokenService,
        ICurrentUserService currentUser,
        IConfiguration config,
        ILogger<AuthController> logger
    )
    {
        _db = db;
        _tokenService = tokenService;
        _currentUser = currentUser;
        _config = config;
        _logger = logger;
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    /// <summary>Yeni müşteri hesabı oluşturur.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), 201)]
    [ProducesResponseType(typeof(MessageResponse), 409)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        // Email benzersizlik kontrolü
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new MessageResponse("Bu e-posta adresi zaten kullanılıyor.", false));

        var user = new User
        {
            Email = req.Email.ToLower().Trim(),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Phone = req.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.Customer,
            IsVerified = false,
            VerificationToken = Guid.NewGuid().ToString(),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // TODO: Verification email gönder (NotificationService entegre edilince)
        _logger.LogInformation("Yeni kullanıcı kaydoldu: {Email}", user.Email);

        var (accessToken, refreshToken, expiresAt) = await IssueTokens(user);

        return CreatedAtAction(
            nameof(Me),
            null,
            MapAuthResponse(user, accessToken, refreshToken, expiresAt)
        );
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    /// <summary>Email + şifre ile giriş yapar, JWT + RefreshToken döner.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Email == req.Email.ToLower() && !u.IsDeleted);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            _logger.LogWarning("Başarısız giriş denemesi: {Email}", req.Email);
            return Unauthorized(new MessageResponse("E-posta veya şifre hatalı.", false));
        }

        var (accessToken, refreshToken, expiresAt) = await IssueTokens(user);

        _logger.LogInformation("Kullanıcı giriş yaptı: {Email} [{Role}]", user.Email, user.Role);

        return Ok(MapAuthResponse(user, accessToken, refreshToken, expiresAt));
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────
    /// <summary>Geçerli bir RefreshToken ile yeni AccessToken alır.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(RefreshTokenResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 401)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest req)
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == req.RefreshToken
                && u.RefreshTokenExpiry > DateTime.UtcNow
                && !u.IsDeleted
            );

        if (user is null)
            return Unauthorized(new MessageResponse("Geçersiz veya süresi dolmuş token.", false));

        var accessToken = _tokenService.GenerateAccessToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(
            int.TryParse(_config["JWT_EXPIRES_MINUTES"], out var m) ? m : 15
        );

        return Ok(new RefreshTokenResponse(accessToken, expiresAt));
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────
    /// <summary>RefreshToken'ı geçersiz kılar (sunucu tarafı logout).</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(MessageResponse), 200)]
    public async Task<IActionResult> Logout()
    {
        var user = await _db.Users.FindAsync(_currentUser.UserId);
        if (user is null)
            return NotFound();

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new MessageResponse("Çıkış yapıldı."));
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────
    /// <summary>JWT token'dan mevcut kullanıcı bilgisini döner.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfoResponse), 200)]
    public async Task<IActionResult> Me()
    {
        // String olan UserId'yi Guid'e çeviriyoruz
        if (!Guid.TryParse(_currentUser.UserId, out var currentGuid))
        {
            return Unauthorized();
        }

        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Id == currentGuid && !u.IsDeleted);

        if (user is null)
            return NotFound();

        return Ok(MapUserInfo(user));
    }

    // ── POST /api/auth/forgot-password ────────────────────────────────────────
    /// <summary>Şifre sıfırlama e-postası gönderir.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(MessageResponse), 200)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == req.Email.ToLower() && !u.IsDeleted
        );

        // Güvenlik: kullanıcı yoksa da aynı yanıtı dön (enumeration saldırısı önlemi)
        if (user is not null)
        {
            user.PasswordResetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetExpiry = DateTime.UtcNow.AddHours(2);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // TODO: NotificationService ile şifre sıfırlama e-postası gönder
            _logger.LogInformation("Şifre sıfırlama isteği: {Email}", user.Email);
        }

        return Ok(
            new MessageResponse("Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.")
        );
    }

    // ── POST /api/auth/reset-password ─────────────────────────────────────────
    /// <summary>Sıfırlama token'ı ile yeni şifre belirler.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(MessageResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 400)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == req.Token // İkisi de string olmalı
            && u.PasswordResetExpiry > DateTime.UtcNow
            && !u.IsDeleted
        );

        if (user is null)
            return BadRequest(new MessageResponse("Geçersiz veya süresi dolmuş token.", false));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        // Mevcut tüm sessionları geçersiz kıl
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new MessageResponse("Şifreniz başarıyla güncellendi."));
    }

    // ── POST /api/auth/verify-email ───────────────────────────────────────────
    /// <summary>E-posta doğrulama token'ı ile hesabı aktifleştirir.</summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(MessageResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 400)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.VerificationToken == req.Token && !u.IsDeleted
        );

        if (user is null)
            return BadRequest(new MessageResponse("Geçersiz doğrulama token'ı.", false));

        if (user.IsVerified)
            return Ok(new MessageResponse("Hesap zaten doğrulanmış."));

        user.IsVerified = true;
        user.VerificationToken = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new MessageResponse("E-posta adresiniz başarıyla doğrulandı."));
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    /// <summary>Yeni token çifti üretir ve DB'ye kaydeder.</summary>
    private async Task<(string AccessToken, string RefreshToken, DateTime ExpiresAt)> IssueTokens(
        User user
    )
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
        await _db.SaveChangesAsync();

        return (accessToken, refreshToken, expiresAt);
    }

    private static AuthResponse MapAuthResponse(
        User user,
        string accessToken,
        string refreshToken,
        DateTime expiresAt
    ) => new(accessToken, refreshToken, expiresAt, MapUserInfo(user));

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
