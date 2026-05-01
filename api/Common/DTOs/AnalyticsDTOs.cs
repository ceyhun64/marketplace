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
}

public class SalesPeriodDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
}

public class MarketplaceComparisonDto
{
    public decimal MarketplaceRevenue { get; set; }
    public decimal EstoreRevenue { get; set; }
    public int MarketplaceOrders { get; set; }
    public int EstoreOrders { get; set; }
    public double MarketplaceConversionRate { get; set; }
    public double EstoreConversionRate { get; set; }
}

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class AdminOverviewDto
{
    public decimal TotalGmv { get; set; }
    // Frontend "totalMerchants" bekliyor
    public int TotalMerchants { get; set; }
    // Frontend "totalOrders" bekliyor (bugünkü değil, genel toplam)
    public int TotalOrders { get; set; }
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
    public List<CourierPerformanceDto> CourierPerformance { get; set; } = new();
}

public class CourierPerformanceDto
{
    public Guid CourierId { get; set; }
    public string CourierName { get; set; } = string.Empty;
    public int DeliveredCount { get; set; }
    public double AverageDeliveryHours { get; set; }
}
