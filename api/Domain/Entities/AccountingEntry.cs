namespace api.Domain.Entities;

/// <summary>
/// Her satış, iade veya düzeltme işlemi için muhasebe kaydı.
/// Invoice → AccountingEntry ilişkisi 1:N'dir.
/// </summary>
public class AccountingEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public Guid OrderId { get; set; }
    public Guid MerchantId { get; set; }

    /// <summary>SALE | REFUND | ADJUSTMENT</summary>
    public string EntryType { get; set; } = "SALE";

    /// <summary>Pozitif = gelir, Negatif = iade/düzeltme.</summary>
    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;

    /// <summary>Referans ödeme ID'si (iyzico conversationId).</summary>
    public string? PaymentReference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Invoice Invoice { get; set; } = null!;
    public Order Order { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
}
