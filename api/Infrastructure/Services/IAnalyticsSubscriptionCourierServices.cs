using api.Common.DTOs;

namespace api.Infrastructure.Services;

// ── Analytics ──────────────────────────────────────────────────────────────
public interface IAnalyticsService
{
    Task<MerchantSalesDto> GetMerchantSalesAsync(string period);
    Task<MarketplaceComparisonDto> GetMarketplaceVsEstoreComparisonAsync();
    Task<IEnumerable<TopProductDto>> GetTopProductsAsync(int limit);
    Task<AdminOverviewDto> GetAdminOverviewAsync();
    Task<RevenueReportDto> GetRevenueReportAsync(string period);
    Task<FulfillmentAnalyticsDto> GetFulfillmentAnalyticsAsync();
}

// ── Subscription ───────────────────────────────────────────────────────────
public interface ISubscriptionService
{
    Task<IEnumerable<SubscriptionPlanDto>> GetPlansAsync();
    Task<ServiceResult<SubscriptionDto>> SubscribeAsync(SubscribeRequestDto request);
    Task<SubscriptionDto?> GetCurrentSubscriptionAsync();
    Task<ServiceResult<bool>> CancelSubscriptionAsync();
    Task<IEnumerable<PluginDto>> GetPluginsAsync();
    Task<ServiceResult<bool>> SubscribePluginAsync(Guid pluginId);
}

// ── Courier ────────────────────────────────────────────────────────────────
public interface ICourierService
{
    Task<IEnumerable<CourierDto>> GetAllAsync(bool? isActive);
    Task<CourierDto?> GetByIdAsync(Guid id);
    Task<ServiceResult<CourierDto>> CreateAsync(CreateCourierDto request);
    Task<ServiceResult<CourierDto>> UpdateAsync(Guid id, UpdateCourierDto request);
    Task<ServiceResult<bool>> ToggleActiveAsync(Guid id);
    Task<IEnumerable<ShipmentDto>> GetShipmentsAsync(Guid courierId, string? status);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
