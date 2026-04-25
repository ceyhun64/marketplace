namespace api.Domain.Entities;

/// <summary>
/// Merchant ile Plugin arasındaki N:M ilişki tablosu.
/// Bir merchant aynı plugin'i birden fazla kez satın alamaz (unique constraint).
/// </summary>
public class MerchantPlugin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Guid PluginId { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Plugin'e özgü JSON yapılandırma (API key, webhook URL vb.).</summary>
    public string? Config { get; set; }

    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    /// <summary>iyzico ödeme referansı.</summary>
    public string? PaymentId { get; set; }

    public bool AutoRenew { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MerchantProfile Merchant { get; set; } = null!;
    public Plugin Plugin { get; set; } = null!;
}
