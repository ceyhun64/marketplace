using api.Common.DTOs;

namespace api.Infrastructure.Services;

public interface IAnalyticsService
{
    Task<MerchantSalesDto> GetMerchantSalesAsync(string period);
    Task<MarketplaceComparisonDto> GetMarketplaceVsEstoreComparisonAsync();
    Task<IEnumerable<TopProductDto>> GetTopProductsAsync(int limit);
    Task<AdminOverviewDto> GetAdminOverviewAsync();
    Task<RevenueReportDto> GetRevenueReportAsync(string period);
    Task<FulfillmentAnalyticsDto> GetFulfillmentAnalyticsAsync();
}
