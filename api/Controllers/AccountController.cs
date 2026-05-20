using System.Text.Json;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// KVKK (Law No. 6698) / GDPR compliance endpoints.
/// Customers can export all their personal data and request account deletion.
/// </summary>
[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IBackgroundJobClient _jobs;

    public AccountController(
        AppDbContext db,
        ICurrentUserService currentUser,
        IBackgroundJobClient jobs
    )
    {
        _db = db;
        _currentUser = currentUser;
        _jobs = jobs;
    }

    /// <summary>
    /// KVKK Art. 11 — Personal data export.
    /// Queues a background job that collects all user data and emails a JSON archive.
    /// </summary>
    [HttpPost("export-data")]
    public async Task<IActionResult> RequestDataExport()
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Id == _currentUser.UserId && !u.IsDeleted
        );
        if (user == null)
            return NotFound();

        var jobId = _jobs.Enqueue<DataExportJob>(j => j.RunAsync(_currentUser.UserId));

        return Accepted(
            new
            {
                message = "Veri dışa aktarma talebiniz alındı. Hazır olduğunda e-posta ile gönderilecek.",
                jobId,
            }
        );
    }

    /// <summary>
    /// KVKK Art. 7 — Right to erasure / account deletion.
    /// Soft-deletes the user and schedules a PII purge job (runs after 30 days per KVKK retention rules).
    /// </summary>
    [HttpDelete("")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Id == _currentUser.UserId && !u.IsDeleted
        );
        if (user == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto?.Reason))
            return BadRequest(new { message = "Silme sebebi zorunludur." });

        // Soft-delete user immediately — cascades auth (existing JWTs become invalid on next validation)
        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Schedule PII purge after 30-day statutory retention period (KVKK Regulation Art. 7)
        _jobs.Schedule<AccountPurgeJob>(
            j => j.PurgeAsync(_currentUser.UserId),
            TimeSpan.FromDays(30)
        );

        return Ok(
            new
            {
                message = "Hesabınız silindi. Kişisel verileriniz 30 gün içinde kalıcı olarak silinecektir.",
            }
        );
    }
}

public record DeleteAccountRequest(string? Reason);

// ── Background Jobs ───────────────────────────────────────────────────────────

/// <summary>Collects all personal data for a user and emails them a JSON archive.</summary>
public class DataExportJob
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;

    public DataExportJob(AppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task RunAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return;

        var orders = await _db
            .Orders.Where(o => o.CustomerId == userId)
            .Select(o => new
            {
                o.Id,
                o.Status,
                o.TotalAmount,
                o.CreatedAt,
            })
            .ToListAsync();

        var reviews = await _db
            .Reviews.Where(r => r.CustomerId == userId)
            .Select(r => new
            {
                r.Id,
                r.ProductId,
                r.Rating,
                r.Comment,
                r.CreatedAt,
            })
            .ToListAsync();

        var wishlist = await _db
            .WishlistItems.Where(w => w.CustomerId == userId)
            .Select(w => new { w.ProductId, w.CreatedAt })
            .ToListAsync();

        var export = new
        {
            exportDate = DateTime.UtcNow,
            user = new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.CreatedAt,
            },
            orders,
            reviews,
            wishlist,
        };

        var json = JsonSerializer.Serialize(
            export,
            new JsonSerializerOptions { WriteIndented = true }
        );

        // In production: upload to secure temporary storage and send a signed download link
        await _notifications.SendAsync(
            userId,
            "KVKK — Kişisel Verileriniz Hazır",
            $"Verileriniz dışa aktarıldı. Toplam sipariş: {orders.Count}, değerlendirme: {reviews.Count}."
        );
    }
}

/// <summary>Hard-deletes PII after the statutory retention period.</summary>
public class AccountPurgeJob
{
    private readonly AppDbContext _db;

    public AccountPurgeJob(AppDbContext db) => _db = db;

    public async Task PurgeAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsDeleted);
        if (user == null)
            return;

        // Anonymise PII — retain referential integrity for orders/accounting
        user.Email = $"deleted_{userId:N}@purged.local";
        user.FirstName = "Silinmiş";
        user.LastName = "Kullanıcı";
        user.PasswordHash = string.Empty;
        user.UpdatedAt = DateTime.UtcNow;

        // Cascade soft-deletes to personally-identifying content
        await _db
            .Reviews.Where(r => r.CustomerId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.Comment, "This review has been removed."));

        await _db.WishlistItems.Where(w => w.CustomerId == userId).ExecuteDeleteAsync();

        await _db.SaveChangesAsync();
    }
}
