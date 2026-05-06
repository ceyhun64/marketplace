using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Ürün yorumları (Review) CRUD.
/// GET herkese açık, POST/DELETE oturum gerektirir.
/// </summary>
[ApiController]
[Route("api/review")]
public class ReviewController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ReviewController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // ── GET /api/review/{productId} — Ürünün yorumlarını listele ─────────────
    [HttpGet("{productId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(Guid productId)
    {
        var product = await _db.Products.FindAsync(productId);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        var reviews = await _db
            .Reviews.Where(r => r.ProductId == productId)
            .Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Title,
                r.Comment,
                r.CreatedAt,
                CustomerName = r.Customer.FirstName
                    + " "
                    + r.Customer.LastName.Substring(0, 1)
                    + ".",
            })
            .ToListAsync();

        return Ok(reviews);
    }

    // ── POST /api/review — Yeni yorum ekle ───────────────────────────────────
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddReview([FromBody] CreateReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest(new { message = "Puan 1 ile 5 arasında olmalıdır." });

        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        var userId = _currentUser.UserId;

        // Aynı kullanıcı aynı ürüne tekrar yorum yapamaz
        var alreadyReviewed = await _db.Reviews.AnyAsync(r =>
            r.CustomerId == userId && r.ProductId == dto.ProductId
        );

        if (alreadyReviewed)
            return Conflict(new { message = "Bu ürün için zaten bir yorum yaptınız." });

        var review = new Review
        {
            ProductId = dto.ProductId,
            CustomerId = userId,
            Rating = dto.Rating,
            Title = dto.Title?.Trim(),
            Comment = dto.Comment?.Trim(),
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetReviews),
            new { productId = dto.ProductId },
            new
            {
                review.Id,
                review.Rating,
                review.Title,
                review.Comment,
                review.CreatedAt,
            }
        );
    }

    // ── DELETE /api/review/{reviewId} — Kendi yorumunu sil ──────────────────
    [HttpDelete("{reviewId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(Guid reviewId)
    {
        var userId = _currentUser.UserId;

        var review = await _db.Reviews.FindAsync(reviewId);
        if (review == null)
            return NotFound(new { message = "Yorum bulunamadı." });

        // Sadece kendi yorumunu silebilir (Admin tüm yorumları silebilir)
        var userRole = _currentUser.Role;
        if (review.CustomerId != userId && userRole != "admin")
            return Forbid();

        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

// ── DTO ──────────────────────────────────────────────────────────────────────
public record CreateReviewDto(Guid ProductId, int Rating, string? Title, string? Comment);
