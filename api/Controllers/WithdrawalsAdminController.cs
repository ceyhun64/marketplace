using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Admin: Merchant withdrawal request approval pipeline.
/// Funds are debited from the wallet only after admin approval here.
/// </summary>
[ApiController]
[Route("api/admin/withdrawals")]
[Authorize(Policy = "AdminOnly")]
public class WithdrawalsAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWalletService _wallet;

    public WithdrawalsAdminController(AppDbContext db, IWalletService wallet)
    {
        _db = db;
        _wallet = wallet;
    }

    /// <summary>GET /api/admin/withdrawals — List all withdrawal requests</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var query = _db.WithdrawalRequests.Include(w => w.Merchant).AsQueryable();

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<WithdrawalStatus>(status, true, out var ws)
        )
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
                MerchantId = w.MerchantId,
                StoreName = w.Merchant.StoreName,
                w.CreatedAt,
                w.ProcessedAt,
            })
            .ToListAsync();

        return Ok(
            new
            {
                data = items,
                pagination = new
                {
                    page,
                    limit,
                    total,
                },
            }
        );
    }

    /// <summary>POST /api/admin/withdrawals/{id}/approve — Approve and debit wallet</summary>
    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] WithdrawalActionDto dto)
    {
        var request = await _db
            .WithdrawalRequests.Include(w => w.Wallet)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (request == null)
            return NotFound(new { message = "Withdrawal request not found." });
        if (request.Status != WithdrawalStatus.Pending)
            return BadRequest(
                new { message = $"Cannot approve a request in '{request.Status}' status." }
            );

        if (request.Wallet.AvailableBalance < request.Amount)
            return BadRequest(new { message = "Merchant no longer has sufficient balance." });

        // Debit the wallet now that admin has approved
        await _wallet.WithdrawAsync(
            request.MerchantId,
            request.Amount,
            reference: $"WITHDRAWAL_REQUEST:{request.Id}"
        );

        request.Status = WithdrawalStatus.Approved;
        request.AdminNote = dto.Note;
        request.ProcessedByAdminId = Guid.Empty; // TODO: inject ICurrentUserService for admin ID
        request.ProcessedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Withdrawal approved and funds debited.", requestId = id });
    }

    /// <summary>POST /api/admin/withdrawals/{id}/reject — Reject without debiting</summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] WithdrawalActionDto dto)
    {
        var request = await _db.WithdrawalRequests.FirstOrDefaultAsync(w => w.Id == id);
        if (request == null)
            return NotFound(new { message = "Withdrawal request not found." });
        if (request.Status != WithdrawalStatus.Pending)
            return BadRequest(
                new { message = $"Cannot reject a request in '{request.Status}' status." }
            );

        request.Status = WithdrawalStatus.Rejected;
        request.AdminNote = dto.Note;
        request.ProcessedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Withdrawal request rejected.", requestId = id });
    }
}

public record WithdrawalActionDto(string? Note);
