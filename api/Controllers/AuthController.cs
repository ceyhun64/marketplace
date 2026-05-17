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
    private readonly INotificationService _notification;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AppDbContext db,
        ITokenService tokenService,
        ICurrentUserService currentUser,
        INotificationService notification,
        IConfiguration config,
        ILogger<AuthController> logger
    )
    {
        _db = db;
        _tokenService = tokenService;
        _currentUser = currentUser;
        _notification = notification;
        _config = config;
        _logger = logger;
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    /// <summary>Yeni müşteri hesabı oluşturur ve doğrulama e-postası gönderir.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), 201)]
    [ProducesResponseType(typeof(MessageResponse), 409)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
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
            VerificationToken = Guid.NewGuid().ToString("N"),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Yeni kullanıcı kaydoldu: {Email}", user.Email);

        // E-posta doğrulama linki gönder
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
        var verifyUrl = $"{frontendUrl}/auth/verify-email?token={user.VerificationToken}";

        _ = Task.Run(async () =>
        {
            try
            {
                await _notification.SendEmailAsync(
                    user.Email,
                    "E-posta adresinizi doğrulayın",
                    $"""
                    Merhaba {user.FirstName},

                    Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:
                    {verifyUrl}

                    Bu bağlantı 24 saat geçerlidir.

                    Eğer bu hesabı siz oluşturmadıysanız bu e-postayı yoksayabilirsiniz.
                    """
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Doğrulama e-postası gönderilemedi: {Email}", user.Email);
            }
        });

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

        // Merchant başvurusu henüz onaylanmamışsa girişe izin verme
        if (user.AccountStatus == AccountStatus.PendingApproval)
            return Unauthorized(
                new MessageResponse(
                    "Hesabınız henüz onaylanmadı. Lütfen yönetici onayını bekleyin.",
                    false
                )
            );

        if (user.AccountStatus == AccountStatus.Rejected)
            return Unauthorized(
                new MessageResponse(
                    $"Başvurunuz reddedildi. Detay: {user.RejectionReason ?? "Belirtilmedi"}",
                    false
                )
            );

        if (user.AccountStatus == AccountStatus.Suspended)
            return Unauthorized(new MessageResponse("Hesabınız askıya alınmıştır.", false));

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

        var (accessToken, newRefreshToken, expiresAt) = await IssueTokens(user);

        // Frontend { accessToken, refreshToken } bekliyor — her ikisini dön
        return Ok(
            new
            {
                accessToken,
                refreshToken = newRefreshToken,
                expiresAt,
            }
        );
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
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfoResponse), 200)]
    public async Task<IActionResult> Me()
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId && !u.IsDeleted);

        if (user is null)
            return NotFound();

        return Ok(MapUserInfo(user));
    }

    // ── PUT /api/auth/me — Profil güncelleme ─────────────────────────────────
    /// <summary>Kullanıcı kendi adını ve telefonunu güncelleyebilir.</summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Id == _currentUser.UserId && !u.IsDeleted
        );

        if (user is null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(req.FirstName))
            user.FirstName = req.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(req.LastName))
            user.LastName = req.LastName.Trim();
        if (req.Phone is not null)
            user.Phone = req.Phone.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
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

            _logger.LogInformation("Şifre sıfırlama isteği: {Email}", user.Email);

            // Şifre sıfırlama e-postası gönder
            var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
            var resetUrl = $"{frontendUrl}/auth/reset-password?token={user.PasswordResetToken}";
            var token = user.PasswordResetToken;

            _ = Task.Run(async () =>
            {
                try
                {
                    await _notification.SendEmailAsync(
                        user.Email,
                        "Şifre Sıfırlama Talebi",
                        $"""
                        Merhaba {user.FirstName},

                        Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
                        {resetUrl}

                        Bu bağlantı 2 saat geçerlidir.

                        Eğer bu talebi siz yapmadıysanız bu e-postayı yoksayabilirsiniz.
                        Hesabınız güvende.
                        """
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Şifre sıfırlama e-postası gönderilemedi: {Email}",
                        user.Email
                    );
                }
            });
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
            u.PasswordResetToken == req.Token
            && u.PasswordResetExpiry > DateTime.UtcNow
            && !u.IsDeleted
        );

        if (user is null)
            return BadRequest(new MessageResponse("Geçersiz veya süresi dolmuş token.", false));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Şifre değişti bildirim e-postası
        _ = Task.Run(async () =>
        {
            try
            {
                await _notification.SendEmailAsync(
                    user.Email,
                    "Şifreniz Başarıyla Değiştirildi",
                    $"""
                    Merhaba {user.FirstName},

                    Şifreniz başarıyla güncellendi.

                    Eğer bu değişikliği siz yapmadıysanız lütfen hemen destek ile iletişime geçin.
                    """
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Şifre değişiklik bildirimi gönderilemedi: {Email}",
                    user.Email
                );
            }
        });

        return Ok(new MessageResponse("Şifreniz başarıyla güncellendi."));
    }

    // ── POST /api/auth/register-merchant ─────────────────────────────────────
    /// <summary>
    /// Option B: Herkes merchant başvurusu yapabilir.
    /// Hesap PendingApproval statüsüyle oluşur; admin onaylayana kadar JWT verilmez.
    /// </summary>
    [HttpPost("register-merchant")]
    [ProducesResponseType(typeof(MessageResponse), 201)]
    [ProducesResponseType(typeof(MessageResponse), 409)]
    [ProducesResponseType(typeof(MessageResponse), 400)]
    public async Task<IActionResult> RegisterMerchant([FromBody] MerchantApplyRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new MessageResponse("Bu e-posta adresi zaten kullanılıyor.", false));

        if (await _db.MerchantProfiles.AnyAsync(m => m.Slug == req.Slug))
            return Conflict(new MessageResponse("Bu mağaza URL'i (slug) zaten kullanımda.", false));

        var user = new User
        {
            Email = req.Email.ToLower().Trim(),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Phone = req.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.Merchant,
            AccountStatus = AccountStatus.PendingApproval, // ← onay bekliyor
            IsVerified = false,
            VerificationToken = Guid.NewGuid().ToString("N"),
        };

        var merchant = new MerchantProfile
        {
            UserId = user.Id,
            StoreName = req.StoreName.Trim(),
            Slug = req.Slug.ToLower().Trim(),
            Description = req.Description?.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            HandlingHours = req.HandlingHours,
            IsActive = false, // admin onaylayana kadar pasif
        };

        _db.Users.Add(user);
        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Yeni merchant başvurusu: {Email} / Mağaza: {Store}",
            user.Email,
            merchant.StoreName
        );

        // Admin'e bildirim e-postası (arka planda)
        var adminEmail = _config["ADMIN_EMAIL"];
        if (!string.IsNullOrEmpty(adminEmail))
        {
            var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
            _ = Task.Run(async () =>
            {
                try
                {
                    await _notification.SendEmailAsync(
                        adminEmail,
                        "Yeni Merchant Başvurusu",
                        $"""
                        Yeni bir merchant başvurusu geldi:

                        Ad Soyad : {user.FirstName} {user.LastName}
                        E-posta  : {user.Email}
                        Mağaza   : {merchant.StoreName} ({merchant.Slug})

                        Onaylamak veya reddetmek için yönetim panelini ziyaret edin:
                        {frontendUrl}/admin/merchants/pending
                        """
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Admin bildirim e-postası gönderilemedi.");
                }
            });
        }

        return StatusCode(
            201,
            new MessageResponse(
                "Başvurunuz alındı. Yönetici onayından sonra hesabınız aktifleştirilecektir."
            )
        );
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

        _logger.LogInformation("E-posta doğrulandı: {Email}", user.Email);

        return Ok(new MessageResponse("E-posta adresiniz başarıyla doğrulandı."));
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private async Task<(string AccessToken, string RefreshToken, DateTime ExpiresAt)> IssueTokens(
        User user
    )
    {
        // MerchantProfile navigation property token claim için gereklidir.
        // Yüklenmemişse burada eagerly yükle — merchantId claim eksikliği önlenir.
        if (user.MerchantProfile is null && user.Role == UserRole.Merchant)
        {
            await _db.Entry(user).Reference(u => u.MerchantProfile).LoadAsync();
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
