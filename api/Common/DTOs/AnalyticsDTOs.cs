namespace api.Common.DTOs;

// ── Analytics DTOs ──────────────────────────────────────────────────────────

public class MerchantSalesDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public List<SalesPeriodDto> SalesByPeriod { get; set; } = new();
}

public class MerchantStatsDto : MerchantSalesDto
{
    public decimal MarketplaceRevenue { get; set; }
    public decimal EstoreRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int TotalProducts { get; set; }
}

public class SalesPeriodDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
}

public class ChannelStatsDto
{
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
    public double ConversionRate { get; set; }
}

public class MarketplaceComparisonDto
{
    // Nested structure matching frontend expectations
    public ChannelStatsDto Marketplace { get; set; } = new();
    public ChannelStatsDto Estore { get; set; } = new();

    // Flat aliases for backward compatibility
    public decimal MarketplaceRevenue => Marketplace.Revenue;
    public decimal EstoreRevenue => Estore.Revenue;
    public int MarketplaceOrders => Marketplace.Orders;
    public int EstoreOrders => Estore.Orders;
    public double MarketplaceConversionRate => Marketplace.ConversionRate;
    public double EstoreConversionRate => Estore.ConversionRate;
}

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    // Alias for frontend (useAnalytics expects totalQuantity)
    public int TotalQuantity => TotalSold;
    public decimal TotalRevenue { get; set; }
    public decimal MarketplaceRevenue { get; set; }
    public decimal EstoreRevenue { get; set; }
}

public class AdminOverviewDto
{
    public decimal TotalGmv { get; set; }
    // Frontend "totalMerchants" bekliyor
    public int TotalMerchants { get; set; }
    // Frontend "totalOrders" bekliyor (bugünkü değil, genel toplam)
    public int TotalOrders { get; set; }
    // Frontend "totalCustomers" bekliyor
    public int TotalCustomers { get; set; }
    public double FulfillmentSuccessRate { get; set; }
    // Frontend "averageDeliveryHours" bekliyor
    public double AverageDeliveryHours { get; set; }
    public int PendingProductApprovals { get; set; }
    public int ActiveCourierCount { get; set; }
    // Geriye dönük uyumluluk için eski alan adları da tut
    public int ActiveMerchantCount => TotalMerchants;
    public int TodayOrderCount { get; set; }
}

public class RevenueReportDto
{
    public string Period { get; set; } = string.Empty;
    public List<MerchantRevenueRowDto> Rows { get; set; } = new();
    /// <summary>Time-series data for revenue/orders charts</summary>
    public List<RevenueChartPointDto> ChartData { get; set; } = new();
}

public class RevenueChartPointDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
    // Alias for frontend compatibility
    public string Label => Date.ToString("MM/dd");
}

public class MerchantRevenueRowDto
{
    public Guid MerchantId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
}

public class FulfillmentAnalyticsDto
{
    public double AverageDeliveryHours { get; set; }
    public double DelayRate { get; set; }
    public int TotalShipments { get; set; }
    public int DeliveredCount { get; set; }
    public int FailedCount { get; set; }
    // Frontend "successRate" alanını da bekliyor
    public double SuccessRate => TotalShipments == 0
        ? 0
        : Math.Round((double)DeliveredCount / TotalShipments * 100, 2);
    // Frontend "activeCourierCount" ve "pendingAssignCount" bekliyor
    public int ActiveCourierCount { get; set; }
    public int PendingAssignCount { get; set; }
    public List<CourierPerformanceDto> CourierPerformance { get; set; } = new();
}

public class CourierPerformanceDto
{
    public Guid CourierId { get; set; }
    public string CourierName { get; set; } = string.Empty;
    public int DeliveredCount { get; set; }
    public double AverageDeliveryHours { get; set; }
}
