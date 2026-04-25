using api.Domain.Enums;

namespace api.Domain.Entities;

/// <summary>
/// Plugin Marketplace'te listelenen üçüncü taraf eklentiler.
/// </summary>
public class Plugin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-safe tekil tanımlayıcı: google-analytics, live-chat vb.</summary>
    public string Slug { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }

    /// <summary>SEO | Analytics | Chat | Marketing | Accounting | Other</summary>
    public string Category { get; set; } = "Other";

    public decimal MonthlyPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;

    /// <summary>Bu plugin'i kullanabilmek için gereken minimum abonelik planı.</summary>
    public PlanType MinimumPlan { get; set; } = PlanType.Pro;

    public string? DeveloperName { get; set; }
    public string? DocumentationUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<MerchantPlugin> MerchantPlugins { get; set; } = new List<MerchantPlugin>();
}
