using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

/// <summary>
/// Plan-feature matrix:
///   Basic      — Store only; no marketplace, no custom domain, 50 products, no analytics, no plugins
///   Pro        — Marketplace + custom domain + 500 products + analytics + plugins
///   Enterprise — Unlimited everything
/// </summary>
public class SubscriptionGuard : ISubscriptionGuard
{
    private readonly AppDbContext _db;

    public SubscriptionGuard(AppDbContext db) => _db = db;

    public async Task<PlanType> GetPlanAsync(Guid merchantId)
    {
        var plan = await _db
            .Subscriptions.Where(s => s.MerchantId == merchantId && s.IsActive)
            .Select(s => (PlanType?)s.Plan)
            .FirstOrDefaultAsync();
        return plan ?? PlanType.Basic;
    }

    public async Task<bool> CanPublishToMarketAsync(Guid merchantId)
    {
        var plan = await GetPlanAsync(merchantId);
        return plan >= PlanType.Pro;
    }

    public async Task<bool> CanUseCustomDomainAsync(Guid merchantId)
    {
        var plan = await GetPlanAsync(merchantId);
        return plan >= PlanType.Pro;
    }

    public async Task<int> GetProductLimitAsync(Guid merchantId)
    {
        var plan = await GetPlanAsync(merchantId);
        return plan switch
        {
            PlanType.Basic => 50,
            PlanType.Pro => 500,
            PlanType.Enterprise => int.MaxValue,
            _ => 50,
        };
    }

    public async Task<bool> CanAccessAnalyticsAsync(Guid merchantId)
    {
        var plan = await GetPlanAsync(merchantId);
        return plan >= PlanType.Pro;
    }

    public async Task<bool> CanUsePluginsAsync(Guid merchantId)
    {
        var plan = await GetPlanAsync(merchantId);
        return plan >= PlanType.Pro;
    }
}
