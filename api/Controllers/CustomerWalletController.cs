using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/customer/wallet")]
[Authorize]
public class CustomerWalletController : ControllerBase
{
    private readonly AppDbContext _db;

    public CustomerWalletController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        var txns = await _db.CustomerTransactions
            .Where(t => t.CustomerId == userId)
            .ToListAsync();

        var totalLoaded = txns.Where(t => t.Type == "credit").Sum(t => t.Amount);
        var totalSpent  = txns.Where(t => t.Type == "debit").Sum(t => t.Amount);
        var totalRefunds = txns.Where(t => t.Type == "credit" && t.Description.Contains("refund", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Amount);

        return Ok(new
        {
            balance = user.WalletBalance,
            totalLoaded,
            totalSpent,
            totalRefunds,
        });
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var userId = GetUserId();

        var query = _db.CustomerTransactions
            .Where(t => t.CustomerId == userId)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(t => new
            {
                t.Id,
                t.Type,
                t.Amount,
                t.Description,
                t.Reference,
                t.CreatedAt,
            })
            .ToListAsync();

        return Ok(new { total, page, limit, items });
    }
}
