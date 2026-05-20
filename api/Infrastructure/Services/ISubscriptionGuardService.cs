using api.Domain.Enums;

namespace api.Infrastructure.Services;

/// <summary>
/// Enforces subscription-plan feature gates at API level.
/// Inject into command handlers to prevent Basic-plan merchants from using Pro/Enterprise features.
/// </summary>
public interface ISubscriptionGuard
{
    /// <summary>Returns true if the merchant's current plan allows publishing to the marketplace.</summary>
    Task<bool> CanPublishToMarketAsync(Guid merchantId);

    /// <summary>Returns true if the merchant can activate a custom domain.</summary>
    Task<bool> CanUseCustomDomainAsync(Guid merchantId);

    /// <summary>Returns the maximum number of active products allowed for the merchant's plan.</summary>
    Task<int> GetProductLimitAsync(Guid merchantId);

    /// <summary>Returns true if the merchant can access advanced analytics.</summary>
    Task<bool> CanAccessAnalyticsAsync(Guid merchantId);

    /// <summary>Returns true if the merchant can install plugins.</summary>
    Task<bool> CanUsePluginsAsync(Guid merchantId);

    /// <summary>Returns the plan for a given merchant. Null if no active subscription.</summary>
    Task<PlanType> GetPlanAsync(Guid merchantId);
}

