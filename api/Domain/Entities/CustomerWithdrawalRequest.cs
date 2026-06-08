namespace api.Domain.Entities;

/// <summary>
/// Customer wallet withdrawal request. Funds stay in the customer's wallet
/// (User.WalletBalance) until Admin approves — mirrors the merchant
/// WithdrawalRequest pipeline (see WithdrawalsAdminController).
/// </summary>
public class CustomerWithdrawalRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }

    public decimal Amount { get; set; }

    /// <summary>IBAN of the customer's bank account.</summary>
    public string BankIban { get; set; } = string.Empty;
    public string BankAccountName { get; set; } = string.Empty;
    public string? BankName { get; set; }

    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;

    /// <summary>Customer-supplied reference note.</summary>
    public string? Note { get; set; }

    /// <summary>Admin rejection/approval notes.</summary>
    public string? AdminNote { get; set; }

    public Guid? ProcessedByAdminId { get; set; }
    public DateTime? ProcessedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Customer { get; set; } = null!;
}
