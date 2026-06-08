using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Admin: Customer wallet withdrawal request approval pipeline.
/// Funds are debited from User.WalletBalance only after admin approval here —
/// mirrors the merchant pipeline in WithdrawalsAdminController, adapted because
/// customers have no MerchantWallet/IWalletService equivalent.
/// </summary>
[ApiController]
[Route("api/admin/customer-withdrawals")]
[Authorize(Policy = "AdminOnly")]
public class CustomerWithdrawalsAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CustomerWithdrawalsAdminController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    /// <summary>GET /api/admin/customer-withdrawals — List all customer withdrawal requests</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var query = _db.CustomerWithdrawalRequests.Include(w => w.Customer).AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<WithdrawalStatus>(status, true, out var ws))
            query = query.Where(w => w.Status == ws);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(w => w.CreatedAt)
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
                CustomerId = w.CustomerId,
                CustomerEmail = w.Customer.Email,
                w.CreatedAt,
                w.ProcessedAt,
            })
            .ToListAsync();

        return Ok(new
        {
            data = items,
            pagination = new { page, limit, total },
        });
    }

    /// <summary>POST /api/admin/customer-withdrawals/{id}/approve — Approve and debit wallet balance</summary>
    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] CustomerWithdrawalActionDto dto)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);
        try
        {
            var request = await _db.CustomerWithdrawalRequests.FirstOrDefaultAsync(w => w.Id == id);
            if (request == null)
                return NotFound(new { message = "Withdrawal request not found." });
            if (request.Status != WithdrawalStatus.Pending)
                return BadRequest(new { message = $"Cannot approve a request in '{request.Status}' status." });

            var user = await _db.Users.FindAsync(request.CustomerId);
            if (user == null)
                return NotFound(new { message = "Customer not found." });

            if (user.WalletBalance < request.Amount)
                return BadRequest(new { message = "Customer no longer has sufficient balance." });

            user.WalletBalance -= request.Amount;

            _db.CustomerTransactions.Add(new CustomerTransaction
            {
                Id = Guid.NewGuid(),
                CustomerId = user.Id,
                Type = "debit",
                Amount = request.Amount,
                Description = "Wallet withdrawal",
                Reference = $"WITHDRAWAL_REQUEST:{request.Id}",
                CreatedAt = DateTime.UtcNow,
            });

            request.Status = WithdrawalStatus.Approved;
            request.AdminNote = dto.Note;
            request.ProcessedByAdminId = _currentUser.UserId;
            request.ProcessedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new { message = "Withdrawal approved and funds debited.", requestId = id });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>POST /api/admin/customer-withdrawals/{id}/reject — Reject without debiting</summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] CustomerWithdrawalActionDto dto)
    {
        var request = await _db.CustomerWithdrawalRequests.FirstOrDefaultAsync(w => w.Id == id);
        if (request == null)
            return NotFound(new { message = "Withdrawal request not found." });
        if (request.Status != WithdrawalStatus.Pending)
            return BadRequest(new { message = $"Cannot reject a request in '{request.Status}' status." });

        request.Status = WithdrawalStatus.Rejected;
        request.AdminNote = dto.Note;
        request.ProcessedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Withdrawal request rejected.", requestId = id });
    }
}

public record CustomerWithdrawalActionDto(string? Note);
