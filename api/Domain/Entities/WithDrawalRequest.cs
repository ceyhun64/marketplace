namespace api.Domain.Entities;

public enum WithdrawalStatus
{
    Pending,
    Approved,
    Processing,
    Paid,
    Rejected,
}

/// <summary>
/// Merchant withdrawal request. Funds are NOT debited from the wallet until Admin approves.
/// </summary>
public class WithdrawalRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Guid WalletId { get; set; }

    public decimal Amount { get; set; }

    /// <summary>IBAN of the merchant's bank account.</summary>
    public string BankIban { get; set; } = string.Empty;
    public string BankAccountName { get; set; } = string.Empty;
    public string? BankName { get; set; }

    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;

    /// <summary>Merchant-supplied reference note.</summary>
    public string? Note { get; set; }

    /// <summary>Admin rejection/approval notes.</summary>
    public string? AdminNote { get; set; }

    public Guid? ProcessedByAdminId { get; set; }
    public DateTime? ProcessedAt { get; set; }

    /// <summary>Stripe Payout ID once the transfer is initiated.</summary>
    public string? StripePayoutId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MerchantProfile Merchant { get; set; } = null!;
    public MerchantWallet Wallet { get; set; } = null!;
}
