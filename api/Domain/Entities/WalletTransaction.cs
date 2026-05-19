namespace api.Domain.Entities;

/// <summary>
/// Immutable ledger entry for every balance movement on a MerchantWallet.
/// Transaction types:
///   ESCROW_HOLD    — funds moved to pending after order payment confirmed
///   SETTLEMENT     — funds cleared from pending to available after holding period
///   WITHDRAWAL     — merchant withdraws available funds
///   REFUND_DEBIT   — chargeback / refund deducted from wallet
/// </summary>
public class WalletTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WalletId { get; set; }
    public Guid MerchantId { get; set; }

    /// <summary>ESCROW_HOLD | SETTLEMENT | WITHDRAWAL | REFUND_DEBIT</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Always positive; direction is implied by Type.</summary>
    public decimal Amount { get; set; }

    public decimal PendingBefore { get; set; }
    public decimal PendingAfter { get; set; }
    public decimal AvailableBefore { get; set; }
    public decimal AvailableAfter { get; set; }

    public Guid? OrderId { get; set; }
    public Guid? VendorOrderId { get; set; }

    /// <summary>External payment reference (Stripe PaymentIntent ID, payout ID, etc.)</summary>
    public string? Reference { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ─────────────────────────────────────────────────────────────
    public MerchantWallet Wallet { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
}
