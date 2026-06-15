using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

/// <summary>
/// All balance-mutating methods in this service use a two-level protection strategy:
///
/// 1. Database transaction at RepeatableRead isolation — prevents phantom reads and
///    ensures the balance snapshot read at the start of the operation is stable.
///
/// 2. EF Core optimistic concurrency via MerchantWallet.RowVersion — if two concurrent
///    requests both read the same RowVersion and one commits first, the second will
///    receive DbUpdateConcurrencyException.  The outer retry loop in
///    ExecuteWithWalletRetryAsync rolls back the stale transaction, reloads the wallet
///    from the database (fresh RowVersion), and retries up to MaxConcurrencyRetries times
///    with exponential back-off + random jitter to spread contention.
///
/// This eliminates the "lost update" scenario that RepeatableRead alone cannot prevent
/// when the application layer holds the balance in memory across async continuations.
/// </summary>
public class WalletService : IWalletService
{
    private readonly AppDbContext _db;
    private readonly ILogger<WalletService> _logger;

    private const int MaxConcurrencyRetries = 3;

    public WalletService(AppDbContext db, ILogger<WalletService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Public interface ──────────────────────────────────────────────────────

    public async Task<MerchantWallet> GetOrCreateWalletAsync(Guid merchantId)
    {
        // INSERT … ON CONFLICT DO NOTHING eliminates the TOCTOU race condition that
        // exists in a read-then-insert pattern: two concurrent callers may both find
        // no wallet and attempt to insert; PostgreSQL's unique constraint on MerchantId
        // lets one succeed silently while the other no-ops, so both callers then
        // resolve the single authoritative wallet row on the following SELECT.
        var newId = Guid.NewGuid();
        var now   = DateTime.UtcNow;
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"INSERT INTO ""MerchantWallets""
                   (""Id"",""MerchantId"",""PendingBalance"",""AvailableBalance"",""TotalWithdrawn"",""CreatedAt"",""UpdatedAt"")
               VALUES ({newId},{merchantId},0,0,0,{now},{now})
               ON CONFLICT (""MerchantId"") DO NOTHING");

        return await _db.MerchantWallets.FirstAsync(w => w.MerchantId == merchantId);
    }

    public Task HoldEscrowAsync(VendorOrder vendorOrder) =>
        ExecuteWithWalletRetryAsync(nameof(HoldEscrowAsync), async () =>
        {
            var wallet = await GetOrCreateWalletAsync(vendorOrder.MerchantId);

            var txn = new WalletTransaction
            {
                Id              = Guid.NewGuid(),
                WalletId        = wallet.Id,
                MerchantId      = vendorOrder.MerchantId,
                Type            = "ESCROW_HOLD",
                Amount          = vendorOrder.MerchantNetAmount,
                PendingBefore   = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId         = vendorOrder.OrderId,
                VendorOrderId   = vendorOrder.Id,
                Notes           = $"Escrow hold for vendor order {vendorOrder.Id}",
                CreatedAt       = DateTime.UtcNow,
            };

            wallet.PendingBalance += vendorOrder.MerchantNetAmount;
            wallet.UpdatedAt       = DateTime.UtcNow;

            txn.PendingAfter   = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Escrow held: MerchantId={MerchantId} Amount={Amount} VendorOrderId={VendorOrderId}",
                vendorOrder.MerchantId, vendorOrder.MerchantNetAmount, vendorOrder.Id);
        });

    public Task SettleVendorOrderAsync(VendorOrder vendorOrder) =>
        ExecuteWithWalletRetryAsync(nameof(SettleVendorOrderAsync), async () =>
        {
            var wallet = await GetOrCreateWalletAsync(vendorOrder.MerchantId);

            var amount = Math.Min(vendorOrder.MerchantNetAmount, wallet.PendingBalance);
            if (amount <= 0)
            {
                _logger.LogWarning(
                    "Settlement skipped (zero/negative amount): VendorOrderId={Id}", vendorOrder.Id);
                return;
            }

            var txn = new WalletTransaction
            {
                Id              = Guid.NewGuid(),
                WalletId        = wallet.Id,
                MerchantId      = vendorOrder.MerchantId,
                Type            = "SETTLEMENT",
                Amount          = amount,
                PendingBefore   = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId         = vendorOrder.OrderId,
                VendorOrderId   = vendorOrder.Id,
                Notes           = $"Settlement for vendor order {vendorOrder.Id}",
                CreatedAt       = DateTime.UtcNow,
            };

            wallet.PendingBalance   -= amount;
            wallet.AvailableBalance += amount;
            wallet.UpdatedAt         = DateTime.UtcNow;

            txn.PendingAfter   = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            vendorOrder.SettledAt  = DateTime.UtcNow;
            vendorOrder.UpdatedAt  = DateTime.UtcNow;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Settlement complete: MerchantId={MerchantId} Amount={Amount} VendorOrderId={VendorOrderId}",
                vendorOrder.MerchantId, amount, vendorOrder.Id);
        });

    public Task ReleaseEscrowAsync(VendorOrder vendorOrder) =>
        ExecuteWithWalletRetryAsync(nameof(ReleaseEscrowAsync), async () =>
        {
            var wallet = await GetOrCreateWalletAsync(vendorOrder.MerchantId);

            var amount = Math.Min(vendorOrder.MerchantNetAmount, wallet.PendingBalance);
            if (amount <= 0)
            {
                _logger.LogWarning(
                    "Escrow release skipped (zero/negative amount): VendorOrderId={Id}", vendorOrder.Id);
                return;
            }

            var txn = new WalletTransaction
            {
                Id              = Guid.NewGuid(),
                WalletId        = wallet.Id,
                MerchantId      = vendorOrder.MerchantId,
                Type            = "ESCROW_RELEASE",
                Amount          = amount,
                PendingBefore   = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId         = vendorOrder.OrderId,
                VendorOrderId   = vendorOrder.Id,
                Notes           = $"Escrow released for cancelled/failed vendor order {vendorOrder.Id}",
                CreatedAt       = DateTime.UtcNow,
            };

            wallet.PendingBalance -= amount;
            wallet.UpdatedAt       = DateTime.UtcNow;

            txn.PendingAfter   = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Escrow released: MerchantId={MerchantId} Amount={Amount} VendorOrderId={VendorOrderId}",
                vendorOrder.MerchantId, amount, vendorOrder.Id);
        });

    public Task DebitRefundAsync(Guid merchantId, decimal amount, Guid orderId, string reference) =>
        ExecuteWithWalletRetryAsync(nameof(DebitRefundAsync), async () =>
        {
            var wallet = await GetOrCreateWalletAsync(merchantId);
            var debit  = Math.Min(amount, wallet.AvailableBalance + wallet.PendingBalance);

            // Debit from available first, then from pending (worst-case fallback)
            var fromAvailable = Math.Min(debit, wallet.AvailableBalance);
            var fromPending   = debit - fromAvailable;

            var txn = new WalletTransaction
            {
                Id              = Guid.NewGuid(),
                WalletId        = wallet.Id,
                MerchantId      = merchantId,
                Type            = "REFUND_DEBIT",
                Amount          = debit,
                PendingBefore   = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId         = orderId,
                Reference       = reference,
                Notes           = $"Refund debit for order {orderId}",
                CreatedAt       = DateTime.UtcNow,
            };

            wallet.AvailableBalance -= fromAvailable;
            wallet.PendingBalance   -= fromPending;
            wallet.UpdatedAt         = DateTime.UtcNow;

            txn.PendingAfter   = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();
        });

    public async Task<WalletTransaction> WithdrawAsync(
        Guid merchantId,
        decimal amount,
        string reference)
    {
        WalletTransaction? result = null;

        await ExecuteWithWalletRetryAsync(nameof(WithdrawAsync), async () =>
        {
            var wallet = await GetOrCreateWalletAsync(merchantId);

            if (wallet.AvailableBalance < amount)
                throw new InvalidOperationException("Insufficient available balance.");

            var txn = new WalletTransaction
            {
                Id              = Guid.NewGuid(),
                WalletId        = wallet.Id,
                MerchantId      = merchantId,
                Type            = "WITHDRAWAL",
                Amount          = amount,
                PendingBefore   = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                Reference       = reference,
                Notes           = $"Withdrawal — ref: {reference}",
                CreatedAt       = DateTime.UtcNow,
            };

            wallet.AvailableBalance -= amount;
            wallet.TotalWithdrawn   += amount;
            wallet.UpdatedAt         = DateTime.UtcNow;

            txn.PendingAfter   = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();

            result = txn;
        });

        return result!;
    }

    public async Task<List<WalletTransaction>> GetTransactionsAsync(
        Guid merchantId,
        int page,
        int limit) =>
        await _db.WalletTransactions
            .Where(t => t.MerchantId == merchantId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

    // ── Concurrency retry infrastructure ─────────────────────────────────────

    /// <summary>
    /// Wraps a balance-mutating operation in a RepeatableRead transaction and retries
    /// up to <see cref="MaxConcurrencyRetries"/> times when EF Core detects a
    /// concurrent row-version conflict (<see cref="DbUpdateConcurrencyException"/>).
    ///
    /// Retry schedule (base + random jitter to avoid thundering herd):
    ///   Attempt 1 → ~20 ms
    ///   Attempt 2 → ~40 ms
    ///   Attempt 3 → ~80 ms
    ///
    /// On each retry the transaction is rolled back and the wallet row is reloaded
    /// from the database so the next attempt works with a fresh RowVersion token.
    /// If all retries are exhausted the final <see cref="DbUpdateConcurrencyException"/>
    /// propagates to the caller.
    /// </summary>
    private async Task ExecuteWithWalletRetryAsync(
        string operationName,
        Func<Task> operation)
    {
        // When called within an existing ambient transaction (e.g., the Serializable
        // transaction in CreateOrderCommandHandler), starting another transaction on the
        // same DbContext connection throws. The ambient transaction already provides
        // >= RepeatableRead isolation, so run directly and let the caller handle commit/rollback.
        if (_db.Database.CurrentTransaction != null)
        {
            await operation();
            return;
        }

        for (var attempt = 1; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var tx = await _db.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.RepeatableRead);
            try
            {
                await operation();
                await tx.CommitAsync();
                return; // success — exit retry loop
            }
            catch (DbUpdateConcurrencyException ex) when (attempt < MaxConcurrencyRetries)
            {
                await tx.RollbackAsync();

                _logger.LogWarning(
                    "Wallet concurrency conflict on {Operation} — attempt {Attempt}/{Max}. " +
                    "Reloading stale entries and retrying.",
                    operationName, attempt, MaxConcurrencyRetries);

                // Refresh every stale entity so the next attempt reads the current
                // RowVersion from the database instead of the cached snapshot.
                foreach (var entry in ex.Entries)
                    await entry.ReloadAsync();

                // Exponential back-off: 2^attempt × 10 ms + random jitter [0, 20) ms
                var delayMs = (int)Math.Pow(2, attempt) * 10 + Random.Shared.Next(0, 20);
                await Task.Delay(delayMs);
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
    }
}
