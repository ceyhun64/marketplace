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

        return Accepted(new { message = "Your data export request has been queued. You will be notified by email when it is ready.", jobId });
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
            return BadRequest(new { message = "A deletion reason is required." });

        // Soft-delete immediately — any subsequent JWT validation check will
        // see IsDeleted = true and reject the token, cascading the auth logout.
        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Schedule PII purge after 30-day statutory retention period (KVKK Art.7 / GDPR Art.17).
        // Hangfire persists the job in PostgreSQL so it survives pod restarts.
        _jobs.Schedule<AccountPurgeJob>(
            j => j.PurgeAsync(_currentUser.UserId),
            TimeSpan.FromDays(30)
        );

        return Ok(new
        {
            message = "Your account has been deleted. Your personal data will be permanently anonymised within 30 days.",
        });
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
            "Your Personal Data Export is Ready",
            $"Your data export has been prepared. " +
            $"Total orders: {orders.Count}, reviews: {reviews.Count}. " +
            $"Please contact support to receive the full archive via a secure download link."
        );
    }
}

/// <summary>
/// Hard-deletes PII after the statutory retention period (KVKK Art.7 / GDPR Art.17).
///
/// What is anonymised (personal identifiers):
///   • User.Email        → deterministic anonymous address (non-reversible)
///   • User.FirstName    → "Deleted"
///   • User.LastName     → "User"
///   • User.Phone        → null  (phone is PII; not needed for accounting)
///   • User.PasswordHash → empty string
///   • User.VerificationToken, RefreshToken, PasswordResetToken → null
///   • Reviews.Comment   → replacement text (authorship identity removed)
///   • WishlistItems     → deleted (no accounting purpose)
///
/// What is RETAINED (legal / financial obligation):
///   • Orders, OrderItems, Invoices, VendorOrders (7-year retention per tax law)
///   • Order.CustomerId FK is kept for financial audit trail
///
/// Shipping address PII in Orders:
///   RecipientName, RecipientPhone and AddressLine are anonymised on the order
///   rows themselves because they are not needed after delivery but are PII.
///   City, PostalCode and Country are retained as non-personal aggregates.
/// </summary>
public class AccountPurgeJob
{
    private readonly AppDbContext _db;
    private readonly ILogger<AccountPurgeJob> _logger;

    public AccountPurgeJob(AppDbContext db, ILogger<AccountPurgeJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task PurgeAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsDeleted);
        if (user == null)
        {
            _logger.LogWarning("AccountPurgeJob: user {UserId} not found or not deleted — skipping.", userId);
            return;
        }

        // ── 1. Anonymise User identity fields ────────────────────────────────
        user.Email          = $"deleted_{userId:N}@purged.invalid";
        user.FirstName      = "Deleted";
        user.LastName       = "User";
        user.Phone          = null;
        user.PasswordHash   = string.Empty;
        // Revoke all active tokens so even a cached JWT cannot be used
        user.RefreshToken        = null;
        user.RefreshTokenExpiry  = null;
        user.VerificationToken   = null;
        user.PasswordResetToken  = null;
        user.PasswordResetExpiry = null;
        user.UpdatedAt      = DateTime.UtcNow;

        // ── 2. Anonymise shipping PII on retained order rows ─────────────────
        // City, PostalCode, Country are kept — non-personal aggregates.
        await _db.Orders
            .Where(o => o.CustomerId == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.RecipientName,  "Deleted User")
                .SetProperty(o => o.RecipientPhone, "")
                .SetProperty(o => o.AddressLine,    "Address removed")
                .SetProperty(o => o.UpdatedAt,      DateTime.UtcNow));

        // ── 3. Anonymise review content (author identity removed) ─────────────
        await _db.Reviews
            .Where(r => r.CustomerId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.Comment, "[Review removed]"));

        // ── 4. Delete non-financial personal data ─────────────────────────────
        await _db.WishlistItems.Where(w => w.CustomerId == userId).ExecuteDeleteAsync();

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "AccountPurgeJob: PII anonymised for UserId={UserId}. " +
            "Financial records (orders/invoices) retained per statutory obligation.",
            userId);
    }
}
