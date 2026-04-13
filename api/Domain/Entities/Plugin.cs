namespace api.Domain.Entities;

public class Plugin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<MerchantPlugin> MerchantPlugins { get; set; } = new List<MerchantPlugin>();
}

public class MerchantPlugin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Guid PluginId { get; set; }
    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public MerchantProfile Merchant { get; set; } = null!;
    public Plugin Plugin { get; set; } = null!;
}
