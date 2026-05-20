using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

public class CommissionService : ICommissionService
{
    private readonly AppDbContext _db;
    private const decimal DefaultRatePercent = 8.0m;

    public CommissionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<decimal> ResolveRateAsync(Guid merchantId, Guid? categoryId, PlanType? plan)
    {
        var rules = await _db
            .CommissionRules.Where(r =>
                r.IsActive
                && (r.MerchantId == null || r.MerchantId == merchantId)
                && (r.CategoryId == null || r.CategoryId == categoryId)
                && (r.PlanType == null || r.PlanType == plan)
            )
            .OrderByDescending(r => r.Priority)
            .ToListAsync();

        // Return the highest-priority matching rule
        var match = rules.FirstOrDefault(r =>
            (r.MerchantId == merchantId || r.MerchantId == null)
            && (r.CategoryId == categoryId || r.CategoryId == null)
            && (r.PlanType == plan || r.PlanType == null)
        );

        return match?.RatePercent ?? DefaultRatePercent;
    }
}
