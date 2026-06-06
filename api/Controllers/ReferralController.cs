using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/referral")]
[Authorize]
public class ReferralController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReferralController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me")]
    public async Task<IActionResult> GetMyReferral()
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (string.IsNullOrEmpty(user.ReferralCode))
        {
            user.ReferralCode = GenerateCode(user.Id);
            await _db.SaveChangesAsync();
        }

        var referrals = await _db.Referrals
            .Include(r => r.ReferredUser)
            .Where(r => r.ReferrerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.EarnedAmount,
                r.CreatedAt,
                r.CompletedAt,
                referredName = r.ReferredUser.FirstName + " " + r.ReferredUser.LastName,
            })
            .ToListAsync();

        var totalEarned = referrals.Sum(r => r.EarnedAmount);
        var completed   = referrals.Count(r => r.Status == "completed");
        var pending     = referrals.Count(r => r.Status == "pending");

        return Ok(new
        {
            referralCode = user.ReferralCode,
            totalEarned,
            completedReferrals = completed,
            pendingReferrals = pending,
            referrals,
        });
    }

    private static string GenerateCode(Guid userId)
    {
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var hash = userId.GetHashCode();
        var result = new char[6];
        for (int i = 0; i < 6; i++)
        {
            result[i] = chars[Math.Abs((hash >> (i * 5)) % chars.Length)];
        }
        return "BAZR-" + new string(result);
    }
}
