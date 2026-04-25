namespace api.Common.DTOs;

// ── Invoice DTOs ─────────────────────────────────────────────────────────────

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public Guid MerchantId { get; set; }
    public string MerchantStoreName { get; set; } = string.Empty;
    public string CustomerFullName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal VatRate { get; set; }
    public decimal VatAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PdfUrl { get; set; }
    public bool IsSent { get; set; }
    public DateTime IssuedAt { get; set; }
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
}

public class InvoiceLineItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class InvoiceSummaryDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public string MerchantStoreName { get; set; } = string.Empty;
    public string CustomerFullName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime IssuedAt { get; set; }
}

public class AccountingEntryDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string MerchantStoreName { get; set; } = string.Empty;
    public string EntryType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Plugin DTOs ──────────────────────────────────────────────────────────────

public class PluginDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public string MinimumPlan { get; set; } = string.Empty;
    public string? DeveloperName { get; set; }
    public string? DocumentationUrl { get; set; }
    public bool IsSubscribed { get; set; } // current merchant için
}

public class MerchantPluginDto
{
    public Guid Id { get; set; }
    public Guid PluginId { get; set; }
    public string PluginName { get; set; } = string.Empty;
    public string PluginSlug { get; set; } = string.Empty;
    public string? PluginIconUrl { get; set; }
    public bool IsActive { get; set; }
    public string? Config { get; set; }
    public DateTime SubscribedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool AutoRenew { get; set; }
}

public class SubscribePluginDto
{
    public Guid PluginId { get; set; }
}

public class UpdatePluginConfigDto
{
    public string? Config { get; set; }
    public bool? AutoRenew { get; set; }
}

public class CreatePluginDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string Category { get; set; } = "Other";
    public decimal MonthlyPrice { get; set; }
    public string MinimumPlan { get; set; } = "Pro";
    public string? DeveloperName { get; set; }
    public string? DocumentationUrl { get; set; }
}
