using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

public class WalletService : IWalletService
{
    private readonly AppDbContext _db;
    private readonly ILogger<WalletService> _logger;

    public WalletService(AppDbContext db, ILogger<WalletService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<MerchantWallet> GetOrCreateWalletAsync(Guid merchantId)
    {
        // Use INSERT ... ON CONFLICT DO NOTHING to eliminate the TOCTOU race condition.
        // Two concurrent calls for the same merchant will both try to insert;
        // only one will succeed and the other will silently no-op.
        var newId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO ""MerchantWallets"" (""Id"",""MerchantId"",""PendingBalance"",""AvailableBalance"",""TotalWithdrawn"",""CreatedAt"",""UpdatedAt"")
            VALUES ({newId},{merchantId},0,0,0,{now},{now})
            ON CONFLICT (""MerchantId"") DO NOTHING"
        );

        return await _db.MerchantWallets.FirstAsync(w => w.MerchantId == merchantId);
    }

    public async Task HoldEscrowAsync(VendorOrder vendorOrder)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead
        );
        try
        {
            var wallet = await GetOrCreateWalletAsync(vendorOrder.MerchantId);

            var txn = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                MerchantId = vendorOrder.MerchantId,
                Type = "ESCROW_HOLD",
                Amount = vendorOrder.MerchantNetAmount,
                PendingBefore = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId = vendorOrder.OrderId,
                VendorOrderId = vendorOrder.Id,
                Notes = $"Escrow hold for vendor order {vendorOrder.Id}",
                CreatedAt = DateTime.UtcNow,
            };

            wallet.PendingBalance += vendorOrder.MerchantNetAmount;
            wallet.UpdatedAt = DateTime.UtcNow;

            txn.PendingAfter = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            _logger.LogInformation(
                "Escrow held: MerchantId={MerchantId} Amount={Amount} VendorOrderId={VendorOrderId}",
                vendorOrder.MerchantId,
                vendorOrder.MerchantNetAmount,
                vendorOrder.Id
            );
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task SettleVendorOrderAsync(VendorOrder vendorOrder)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead
        );
        try
        {
            var wallet = await GetOrCreateWalletAsync(vendorOrder.MerchantId);

            // Guard: don't over-settle
            var amount = Math.Min(vendorOrder.MerchantNetAmount, wallet.PendingBalance);
            if (amount <= 0)
            {
                _logger.LogWarning(
                    "Settlement skipped (zero/negative amount): VendorOrderId={Id}",
                    vendorOrder.Id
                );
                await tx.RollbackAsync();
                return;
            }

            var txn = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                MerchantId = vendorOrder.MerchantId,
                Type = "SETTLEMENT",
                Amount = amount,
                PendingBefore = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId = vendorOrder.OrderId,
                VendorOrderId = vendorOrder.Id,
                Notes = $"Settlement for vendor order {vendorOrder.Id}",
                CreatedAt = DateTime.UtcNow,
            };

            wallet.PendingBalance -= amount;
            wallet.AvailableBalance += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            txn.PendingAfter = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            vendorOrder.SettledAt = DateTime.UtcNow;
            vendorOrder.UpdatedAt = DateTime.UtcNow;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            _logger.LogInformation(
                "Settlement complete: MerchantId={MerchantId} Amount={Amount} VendorOrderId={VendorOrderId}",
                vendorOrder.MerchantId,
                amount,
                vendorOrder.Id
            );
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task DebitRefundAsync(
        Guid merchantId,
        decimal amount,
        Guid orderId,
        string reference
    )
    {
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead
        );
        try
        {
            var wallet = await GetOrCreateWalletAsync(merchantId);
            var debit = Math.Min(amount, wallet.AvailableBalance + wallet.PendingBalance);

            // Debit from available first, then pending
            var fromAvailable = Math.Min(debit, wallet.AvailableBalance);
            var fromPending = debit - fromAvailable;

            var txn = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                MerchantId = merchantId,
                Type = "REFUND_DEBIT",
                Amount = debit,
                PendingBefore = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                OrderId = orderId,
                Reference = reference,
                Notes = $"Refund debit for order {orderId}",
                CreatedAt = DateTime.UtcNow,
            };

            wallet.AvailableBalance -= fromAvailable;
            wallet.PendingBalance -= fromPending;
            wallet.UpdatedAt = DateTime.UtcNow;

            txn.PendingAfter = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<WalletTransaction> WithdrawAsync(
        Guid merchantId,
        decimal amount,
        string reference
    )
    {
        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead
        );
        try
        {
            var wallet = await GetOrCreateWalletAsync(merchantId);

            if (wallet.AvailableBalance < amount)
                throw new InvalidOperationException("Insufficient available balance.");

            var txn = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                MerchantId = merchantId,
                Type = "WITHDRAWAL",
                Amount = amount,
                PendingBefore = wallet.PendingBalance,
                AvailableBefore = wallet.AvailableBalance,
                Reference = reference,
                Notes = $"Withdrawal — ref: {reference}",
                CreatedAt = DateTime.UtcNow,
            };

            wallet.AvailableBalance -= amount;
            wallet.TotalWithdrawn += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            txn.PendingAfter = wallet.PendingBalance;
            txn.AvailableAfter = wallet.AvailableBalance;

            _db.WalletTransactions.Add(txn);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return txn;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<List<WalletTransaction>> GetTransactionsAsync(
        Guid merchantId,
        int page,
        int limit
    )
    {
        return await _db
            .WalletTransactions.Where(t => t.MerchantId == merchantId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }
}
