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

    /// <summary>POST /api/wallet/withdraw — Request a withdrawal</summary>
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequestDto dto)
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        if (dto.Amount <= 0)
            return BadRequest(new { message = "Withdrawal amount must be positive." });

        try
        {
            var txn = await _wallet.WithdrawAsync(
                merchantId.Value,
                dto.Amount,
                dto.Reference ?? Guid.NewGuid().ToString("N")
            );
            return Ok(
                new
                {
                    message = "Withdrawal recorded successfully.",
                    transactionId = txn.Id,
                    amount = txn.Amount,
                    availableAfter = txn.AvailableAfter,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record WithdrawRequestDto(decimal Amount, string? Reference);
