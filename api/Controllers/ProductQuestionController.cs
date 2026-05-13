using System.Security.Claims;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/questions")]
public class ProductQuestionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductQuestionsController(AppDbContext db) => _db = db;

    // ── GET /api/questions/{productId} — public, paginated ──────────────────
    [HttpGet("{productId:guid}")]
    public async Task<IActionResult> GetByProduct(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10
    )
    {
        var total = await _db
            .ProductQuestions.Where(q => q.ProductId == productId && q.IsPublic)
            .CountAsync();

        var items = await _db
            .ProductQuestions.Where(q => q.ProductId == productId && q.IsPublic)
            .Include(q => q.Customer)
            .Include(q => q.AnsweredByMerchant)
            .OrderByDescending(q => q.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(q => new
            {
                q.Id,
                q.Question,
                q.Answer,
                q.AnsweredAt,
                q.CreatedAt,
                CustomerName = q.Customer.FirstName
                    + " "
                    + q.Customer.LastName.Substring(0, 1)
                    + ".",
                AnsweredByStoreName = q.AnsweredByMerchant != null
                    ? q.AnsweredByMerchant.StoreName
                    : null,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                page,
                limit,
                items,
            }
        );
    }

    // ── POST /api/questions — authenticated user asks a question ────────────
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AskQuestion([FromBody] AskQuestionRequest dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Question) || dto.Question.Trim().Length < 5)
            return BadRequest(new { message = "Soru en az 5 karakter olmalıdır." });

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        var question = new ProductQuestion
        {
            ProductId = dto.ProductId,
            CustomerId = userId,
            Question = dto.Question.Trim(),
            IsPublic = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.ProductQuestions.Add(question);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Sorunuz iletildi.", id = question.Id });
    }

    // ── POST /api/questions/{id}/answer — merchant answers ──────────────────
    [HttpPost("{id:guid}/answer")]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> AnswerQuestion(Guid id, [FromBody] AnswerQuestionRequest dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Answer))
            return BadRequest(new { message = "Cevap boş olamaz." });

        var question = await _db
            .ProductQuestions.Include(q => q.Product)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question == null)
            return NotFound(new { message = "Soru bulunamadı." });

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Merchant can only answer questions for their own products
        if (userRole == "Merchant")
        {
            var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(m =>
                m.UserId == Guid.Parse(userIdClaim!)
            );
            if (merchant == null || question.Product.MerchantId != merchant.Id)
                return Forbid();

            question.AnsweredByMerchantId = merchant.Id;
        }

        question.Answer = dto.Answer.Trim();
        question.AnsweredAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Cevap kaydedildi." });
    }

    // ── DELETE /api/questions/{id} — admin only ──────────────────────────────
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var question = await _db.ProductQuestions.FindAsync(id);
        if (question == null)
            return NotFound();

        _db.ProductQuestions.Remove(question);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record AskQuestionRequest(Guid ProductId, string Question);

public record AnswerQuestionRequest(string Answer);
