using api.Domain.Entities;
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

    /// <summary>POST /api/customer/wallet/withdraw — Submit a withdrawal request (pending admin approval)</summary>
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] CustomerWithdrawRequestDto dto)
    {
        var userId = GetUserId();

        if (dto.Amount <= 0)
            return BadRequest(new { message = "Withdrawal amount must be positive." });

        if (string.IsNullOrWhiteSpace(dto.BankIban))
            return BadRequest(new { message = "Bank IBAN is required." });

        if (string.IsNullOrWhiteSpace(dto.BankAccountName))
            return BadRequest(new { message = "Bank account name is required." });

        // Serializable transaction: the pending-total read and the INSERT must be
        // atomic so two concurrent requests cannot both pass the balance check —
        // mirrors the merchant withdrawal pattern in WalletController.Withdraw.
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);
        try
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var pendingTotal = await _db.CustomerWithdrawalRequests
                .Where(w => w.CustomerId == userId && w.Status == WithdrawalStatus.Pending)
                .SumAsync(w => (decimal?)w.Amount) ?? 0m;

            var effectiveAvailable = user.WalletBalance - pendingTotal;
            if (effectiveAvailable < dto.Amount)
                return BadRequest(new
                {
                    message = $"Insufficient available balance. " +
                              $"Available: {user.WalletBalance:F2}, " +
                              $"Already pending: {pendingTotal:F2}",
                });

            var withdrawalRequest = new CustomerWithdrawalRequest
            {
                Id = Guid.NewGuid(),
                CustomerId = userId,
                Amount = dto.Amount,
                BankIban = dto.BankIban.Trim().ToUpper(),
                BankAccountName = dto.BankAccountName.Trim(),
                BankName = dto.BankName,
                Note = dto.Note,
                Status = WithdrawalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.CustomerWithdrawalRequests.Add(withdrawalRequest);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Withdrawal request submitted. Pending admin approval.",
                requestId = withdrawalRequest.Id,
                amount = withdrawalRequest.Amount,
                status = withdrawalRequest.Status.ToString(),
            });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>GET /api/customer/wallet/withdrawals — Caller's own withdrawal request history</summary>
    [HttpGet("withdrawals")]
    public async Task<IActionResult> GetWithdrawalRequests([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var userId = GetUserId();

        var query = _db.CustomerWithdrawalRequests
            .Where(w => w.CustomerId == userId)
            .OrderByDescending(w => w.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(w => new
            {
                w.Id,
                w.Amount,
                w.BankIban,
                w.BankAccountName,
                w.BankName,
                Status = w.Status.ToString(),
                w.Note,
                w.AdminNote,
                w.ProcessedAt,
                w.CreatedAt,
            })
            .ToListAsync();

        return Ok(new
        {
            data = items,
            pagination = new { page, limit, total },
        });
    }
}

public record CustomerWithdrawRequestDto(
    decimal Amount,
    string BankIban,
    string BankAccountName,
    string? BankName,
    string? Note
);
