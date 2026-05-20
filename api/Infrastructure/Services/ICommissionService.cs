using api.Domain.Enums;

namespace api.Infrastructure.Services;

public interface ICommissionService
{
    /// <summary>
    /// Resolves the commission rate for a given merchant/category/plan combination.
    /// Priority waterfall: (MerchantId + CategoryId + PlanType) > (MerchantId + CategoryId) >
    /// (MerchantId + PlanType) > (CategoryId + PlanType) > (MerchantId) > (CategoryId) >
    /// (PlanType) > global default.
    /// </summary>
    Task<decimal> ResolveRateAsync(Guid merchantId, Guid? categoryId, PlanType? plan);
}
