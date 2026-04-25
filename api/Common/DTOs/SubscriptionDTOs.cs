namespace api.Common.DTOs;

public class SubscriptionPlanDto
{
    public string PlanType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public List<string> Features { get; set; } = new();
    public int? ProductLimit { get; set; }
    public bool MarketplaceAccess { get; set; }
    public bool PluginAccess { get; set; }
}

public class SubscriptionDto
{
    public Guid Id { get; set; }
    public string PlanType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class SubscribeRequestDto
{
    public string PlanType { get; set; } = string.Empty;
    public string? PaymentToken { get; set; }
}


