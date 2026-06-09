using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize(Policy = "MerchantOnly")]
public class WalletController : ControllerBase
{
    private readonly IWalletService _wallet;
    private readonly ICurrentUserService _currentUser;
    private readonly AppDbContext _db;

    public WalletController(IWalletService wallet, ICurrentUserService currentUser, AppDbContext db)
    {
        _wallet = wallet;
        _currentUser = currentUser;
        _db = db;
    }

    /// <summary>GET /api/wallet/me — Merchant's current balances</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetWallet()
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        var w = await _wallet.GetOrCreateWalletAsync(merchantId.Value);
        return Ok(
            new
            {
                w.Id,
                w.MerchantId,
                w.PendingBalance,
                w.AvailableBalance,
                w.TotalWithdrawn,
                w.UpdatedAt,
            }
        );
    }

    /// <summary>GET /api/wallet/transactions — Paginated ledger</summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        var transactions = await _wallet.GetTransactionsAsync(merchantId.Value, page, limit);
        var total = await _db.WalletTransactions.CountAsync(t => t.MerchantId == merchantId.Value);

        return Ok(
            new
            {
                data = transactions.Select(t => new
                {
                    t.Id,
                    t.Type,
                    t.Amount,
                    t.PendingBefore,
                    t.PendingAfter,
                    t.AvailableBefore,
                    t.AvailableAfter,
                    t.OrderId,
                    t.VendorOrderId,
                    t.Reference,
                    t.Notes,
                    t.CreatedAt,
                }),
                pagination = new
                {
                    page,
                    limit,
                    total,
                    pages = (int)Math.Ceiling((double)total / limit),
                },
            }
        );
    }

    /// <summary>POST /api/wallet/withdraw — Submit a withdrawal request (pending admin approval)</summary>
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequestDto dto)
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        if (dto.Amount <= 0)
            return BadRequest(new { message = "Withdrawal amount must be positive." });

        if (string.IsNullOrWhiteSpace(dto.BankIban))
            return BadRequest(new { message = "Bank IBAN is required." });

        if (string.IsNullOrWhiteSpace(dto.BankAccountName))
            return BadRequest(new { message = "Bank account name is required." });

        // Merchant must be active and have completed Stripe onboarding (identity verified).
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId.Value);
        if (merchant == null || !merchant.IsActive)
            return BadRequest(new { message = "Your merchant account is not active." });
        if (!merchant.StripeOnboardingComplete)
            return BadRequest(new { message = "Please complete your Stripe onboarding before requesting a payout." });

        // Use a Serializable transaction so that two concurrent withdrawal requests
        // for the same merchant cannot both pass the balance check and both be saved.
        // Serializable isolation ensures the pending-total read and the INSERT are atomic:
        // if another concurrent transaction has already inserted a pending request that
        // would exceed the balance, one of the two transactions will be rolled back with
        // a serialization failure, which we propagate as a 409 Conflict.
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable);
        try
        {
            var wallet = await _wallet.GetOrCreateWalletAsync(merchantId.Value);

            // Total of all pending (unprocessed) withdrawal requests already filed.
            // This prevents the merchant from over-committing their available balance
            // across multiple concurrent requests.
            var pendingTotal = await _db.WithdrawalRequests
                .Where(w => w.MerchantId == merchantId.Value
                         && w.Status == api.Domain.Entities.WithdrawalStatus.Pending)
                .SumAsync(w => (decimal?)w.Amount) ?? 0m;

            var effectiveAvailable = wallet.AvailableBalance - pendingTotal;
            if (effectiveAvailable < dto.Amount)
                return BadRequest(new
                {
                    message = $"Insufficient available balance. " +
                              $"Available: {wallet.AvailableBalance:F2}, " +
                              $"Already pending: {pendingTotal:F2}",
                });

            // Create a pending WithdrawalRequest — funds are NOT debited until admin approves
            var withdrawalRequest = new api.Domain.Entities.WithdrawalRequest
            {
                Id = Guid.NewGuid(),
                MerchantId = merchantId.Value,
                WalletId = wallet.Id,
                Amount = dto.Amount,
                BankIban = dto.BankIban.Trim().ToUpper(),
                BankAccountName = dto.BankAccountName.Trim(),
                BankName = dto.BankName,
                Note = dto.Note,
                Status = api.Domain.Entities.WithdrawalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.WithdrawalRequests.Add(withdrawalRequest);
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
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            await tx.RollbackAsync();
            throw;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>GET /api/wallet/withdrawals — Merchant's own withdrawal request history</summary>
    [HttpGet("withdrawals")]
    public async Task<IActionResult> GetWithdrawalRequests(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        var query = _db
            .WithdrawalRequests.Where(w => w.MerchantId == merchantId.Value)
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
}

public record WithdrawRequestDto(
    decimal Amount,
    string BankIban,
    string BankAccountName,
    string? BankName,
    string? Note
);
