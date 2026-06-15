using api.Domain.Entities;

namespace api.Infrastructure.Services;

public interface IWalletService
{
    /// <summary>Returns or creates the wallet for a merchant.</summary>
    Task<MerchantWallet> GetOrCreateWalletAsync(Guid merchantId);

    /// <summary>
    /// Moves the merchant's net amount into PendingBalance when an order is paid.
    /// Called by PaymentService after FinalizeOrderPaymentAsync.
    /// </summary>
    Task HoldEscrowAsync(VendorOrder vendorOrder);

    /// <summary>
    /// Clears funds from PendingBalance → AvailableBalance after the holding period.
    /// Called by EscrowSettlementJob.
    /// </summary>
    Task SettleVendorOrderAsync(VendorOrder vendorOrder);

    /// <summary>
    /// Reverses a previously-held escrow when a vendor order is cancelled or its
    /// payment fails before settlement. Removes the merchant's net amount from
    /// PendingBalance. No-op if the order was already settled (SettledAt != null)
    /// or its escrow was already released.
    /// </summary>
    Task ReleaseEscrowAsync(VendorOrder vendorOrder);

    /// <summary>Debit wallet on refund/chargeback.</summary>
    Task DebitRefundAsync(Guid merchantId, decimal amount, Guid orderId, string reference);

    /// <summary>Records a withdrawal and reduces AvailableBalance.</summary>
    Task<WalletTransaction> WithdrawAsync(Guid merchantId, decimal amount, string reference);

    Task<List<WalletTransaction>> GetTransactionsAsync(Guid merchantId, int page, int limit);
}
