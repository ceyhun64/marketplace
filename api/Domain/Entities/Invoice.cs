namespace api.Domain.Entities;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>INV-2026-000001 formatında benzersiz fatura numarası.</summary>
    public string InvoiceNumber { get; set; } = string.Empty;

    public Guid OrderId { get; set; }
    public Guid MerchantId { get; set; }
    public Guid CustomerId { get; set; }

    // Tutar kalemleri
    public decimal SubTotal { get; set; }
    public decimal VatRate { get; set; } = 0.20m;    // %20 KDV
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal ShippingAmount { get; set; }

    // Fatura başlığı bilgileri (snapshot — sonradan değişse de fatura korunur)
    public string MerchantStoreName { get; set; } = string.Empty;
    public string MerchantAddress { get; set; } = string.Empty;
    public string CustomerFullName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;

    // PDF
    public string? PdfUrl { get; set; }              // Cloudinary CDN URL
    public bool IsSent { get; set; } = false;        // e-posta gönderildi mi?

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order Order { get; set; } = null!;
    public MerchantProfile Merchant { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public ICollection<AccountingEntry> AccountingEntries { get; set; } =
        new List<AccountingEntry>();
}