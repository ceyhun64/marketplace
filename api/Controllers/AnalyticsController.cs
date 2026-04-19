using api.Common.DTOs;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    // GET /api/analytics/merchant/sales — Merchant
    [HttpGet("merchant/sales")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMerchantSales([FromQuery] string period = "monthly")
    {
        var data = await _analyticsService.GetMerchantSalesAsync(period);
        return Ok(new ApiResponse<MerchantSalesDto>(data));
    }

    // GET /api/analytics/merchant/comparison — Merchant
    [HttpGet("merchant/comparison")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMerchantComparison()
    {
        var data = await _analyticsService.GetMarketplaceVsEstoreComparisonAsync();
        return Ok(new ApiResponse<MarketplaceComparisonDto>(data));
    }

    // GET /api/analytics/merchant/top-products — Merchant
    [HttpGet("merchant/top-products")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 5)
    {
        var data = await _analyticsService.GetTopProductsAsync(limit);
        return Ok(new ApiResponse<IEnumerable<TopProductDto>>(data));
    }

    // GET /api/analytics/admin/overview — Admin
    [HttpGet("admin/overview")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAdminOverview()
    {
        var data = await _analyticsService.GetAdminOverviewAsync();
        return Ok(new ApiResponse<AdminOverviewDto>(data));
    }

    // GET /api/analytics/admin/revenue — Admin
    [HttpGet("admin/revenue")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAdminRevenue([FromQuery] string period = "monthly")
    {
        var data = await _analyticsService.GetRevenueReportAsync(period);
        return Ok(new ApiResponse<RevenueReportDto>(data));
    }

    // GET /api/analytics/admin/fulfillment — Admin
    [HttpGet("admin/fulfillment")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetFulfillmentAnalytics()
    {
        var data = await _analyticsService.GetFulfillmentAnalyticsAsync();
        return Ok(new ApiResponse<FulfillmentAnalyticsDto>(data));
    }
}
