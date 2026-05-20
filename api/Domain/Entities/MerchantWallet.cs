namespace api.Domain.Entities;

/// <summary>
/// One wallet per merchant. Tracks two balance buckets:
///   PendingBalance  — funds in escrow (delivered but within the holding window)
///   AvailableBalance — cleared funds ready for withdrawal
/// </summary>
public class MerchantWallet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }

    /// <summary>Funds held in escrow; not yet withdrawable.</summary>
    public decimal PendingBalance { get; set; } = 0m;

    /// <summary>Cleared funds; merchant can request withdrawal.</summary>
    public decimal AvailableBalance { get; set; } = 0m;

    /// <summary>Cumulative total withdrawn to date.</summary>
    public decimal TotalWithdrawn { get; set; } = 0m;

    /// <summary>Optimistic concurrency token — prevents lost-update on concurrent balance mutations.</summary>
    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ─────────────────────────────────────────────────────────────
    public MerchantProfile Merchant { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } =
        new List<WalletTransaction>();
}
