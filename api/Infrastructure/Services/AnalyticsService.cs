using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AnalyticsService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // ── Merchant: Satış özeti (daily/weekly/monthly) ───────────────────────
    public async Task<MerchantSalesDto> GetMerchantSalesAsync(string period)
    {
        var merchantId = await GetMerchantIdAsync();
        var sinceDate = PeriodToDate(period);

        // MerchantId, OrderItem'da tutulduğu için Items üzerinden join yapılır
        var items = await _db
            .OrderItems.Include(i => i.Order)
            .Where(i =>
                i.MerchantId == merchantId
                && i.Order.CreatedAt >= sinceDate
                && i.Order.Status != OrderStatus.Cancelled
                && i.Order.Status != OrderStatus.Failed
            )
            .ToListAsync();

        var merchantOrders = items.GroupBy(i => i.Order).Select(g => g.Key).ToList();

        var salesByPeriod = merchantOrders
            .GroupBy(o =>
                period.ToLower() switch
                {
                    "daily" => o.CreatedAt.ToString("HH:00"),
                    "weekly" => o.CreatedAt.DayOfWeek.ToString(),
                    _ => o.CreatedAt.ToString("yyyy-MM-dd"),
                }
            )
            .Select(g => new SalesPeriodDto
            {
                Label = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                OrderCount = g.Count(),
            })
            .OrderBy(x => x.Label)
            .ToList();

        return new MerchantSalesDto
        {
            TotalRevenue = merchantOrders.Sum(o => o.TotalAmount),
            TotalOrders = merchantOrders.Count,
            SalesByPeriod = salesByPeriod,
        };
    }

    // ── Merchant: Marketplace vs E-mağaza karşılaştırması ────────────────
    public async Task<MarketplaceComparisonDto> GetMarketplaceVsEstoreComparisonAsync()
    {
        var merchantId = await GetMerchantIdAsync();

        var orders = await _db
            .OrderItems.Include(i => i.Order)
            .Where(i =>
                i.MerchantId == merchantId
                && i.Order.Status != OrderStatus.Cancelled
                && i.Order.Status != OrderStatus.Failed
            )
            .Select(i => i.Order)
            .Distinct()
            .ToListAsync();

        var marketplace = orders.Where(o => o.Source == OrderSource.Marketplace).ToList();
        var estore = orders.Where(o => o.Source == OrderSource.EStore).ToList();
        int total = marketplace.Count + estore.Count;

        return new MarketplaceComparisonDto
        {
            MarketplaceRevenue = marketplace.Sum(o => o.TotalAmount),
            EstoreRevenue = estore.Sum(o => o.TotalAmount),
            MarketplaceOrders = marketplace.Count,
            EstoreOrders = estore.Count,
            MarketplaceConversionRate =
                total == 0 ? 0 : Math.Round((double)marketplace.Count / total * 100, 2),
            EstoreConversionRate =
                total == 0 ? 0 : Math.Round((double)estore.Count / total * 100, 2),
        };
    }

    // ── Merchant: En çok satan ürünler ────────────────────────────────────
    public async Task<IEnumerable<TopProductDto>> GetTopProductsAsync(int limit)
    {
        var merchantId = await GetMerchantIdAsync();

        return await _db
            .OrderItems.Include(i => i.Product)
            .Where(i => i.MerchantId == merchantId)
            .GroupBy(i => new { i.ProductId, i.Product.Name })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                TotalSold = g.Sum(i => i.Quantity),
                TotalRevenue = g.Sum(i => i.Quantity * i.UnitPrice),
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(limit)
            .ToListAsync();
    }

    // ── Admin: Genel bakış paneli ─────────────────────────────────────────
    public async Task<AdminOverviewDto> GetAdminOverviewAsync()
    {
        var today = DateTime.UtcNow.Date;

        var totalGmv =
            await _db
                .Orders.Where(o => o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.TotalAmount)
            ?? 0m;
        var activeMerchants = await _db.MerchantProfiles.CountAsync(m =>
            m.IsActive && !m.IsSuspended
        );
        var todayOrders = await _db.Orders.CountAsync(o => o.CreatedAt.Date == today);
        var pendingApprovals = await _db.Products.CountAsync(p => !p.IsApproved && !p.IsDeleted);
        var activeCouriers = await _db.Couriers.CountAsync(c => c.IsActive);
        var totalShipments = await _db.Shipments.CountAsync();
        var delivered = await _db.Shipments.CountAsync(s => s.Status == ShipmentStatus.Delivered);

        double successRate =
            totalShipments == 0 ? 0 : Math.Round((double)delivered / totalShipments * 100, 2);

        return new AdminOverviewDto
        {
            TotalGmv = totalGmv,
            ActiveMerchantCount = activeMerchants,
            TodayOrderCount = todayOrders,
            FulfillmentSuccessRate = successRate,
            PendingProductApprovals = pendingApprovals,
            ActiveCourierCount = activeCouriers,
        };
    }

    // ── Admin: Merchant bazlı gelir raporu ────────────────────────────────
    public async Task<RevenueReportDto> GetRevenueReportAsync(string period)
    {
        var sinceDate = PeriodToDate(period);

        // OrderItem.MerchantId üzerinden gruplama
        var rows = await _db
            .OrderItems.Include(i => i.Order)
            .Include(i => i.Product)
                .ThenInclude(p => p.Merchant)
            .Where(i =>
                i.Order.CreatedAt >= sinceDate
                && i.Order.Status != OrderStatus.Cancelled
                && i.Order.Status != OrderStatus.Failed
            )
            .GroupBy(i => new { i.MerchantId, i.Product.Merchant.StoreName })
            .Select(g => new MerchantRevenueRowDto
            {
                MerchantId = g.Key.MerchantId,
                StoreName = g.Key.StoreName,
                Revenue = g.Sum(i => i.Quantity * i.UnitPrice),
                OrderCount = g.Select(i => i.OrderId).Distinct().Count(),
            })
            .OrderByDescending(r => r.Revenue)
            .ToListAsync();

        return new RevenueReportDto { Period = period, Rows = rows };
    }

    // ── Admin/Milestone 2: Fulfillment performans analitikleri ───────────
    public async Task<FulfillmentAnalyticsDto> GetFulfillmentAnalyticsAsync()
    {
        var shipments = await _db
            .Shipments.Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .ToListAsync();

        var total = shipments.Count;
        var delivered = shipments.Where(s => s.Status == ShipmentStatus.Delivered).ToList();
        var failed = shipments.Count(s => s.Status == ShipmentStatus.Failed);

        // Teslim süresi: UpdatedAt - CreatedAt (sadece teslim edilenler)
        double avgDeliveryHours = delivered.Any()
            ? Math.Round(
                delivered
                    .Where(s => s.UpdatedAt > s.CreatedAt)
                    .DefaultIfEmpty()
                    .Average(s => s == null ? 0 : (s.UpdatedAt - s.CreatedAt).TotalHours),
                2
            )
            : 0;

        double delayRate = total == 0 ? 0 : Math.Round((double)failed / total * 100, 2);

        var courierPerf = shipments
            .Where(s => s.CourierId.HasValue)
            .GroupBy(s => new
            {
                s.CourierId,
                Name = (
                    s.Courier?.User == null
                        ? "Bilinmiyor"
                        : (s.Courier.User.FirstName + " " + s.Courier.User.LastName).Trim()
                ),
            })
            .Select(g =>
            {
                var cDelivered = g.Where(s => s.Status == ShipmentStatus.Delivered).ToList();
                double avg = cDelivered.Any()
                    ? Math.Round(cDelivered.Average(s => (s.UpdatedAt - s.CreatedAt).TotalHours), 2)
                    : 0;

                return new CourierPerformanceDto
                {
                    CourierId = g.Key.CourierId!.Value,
                    CourierName = g.Key.Name,
                    DeliveredCount = cDelivered.Count,
                    AverageDeliveryHours = avg,
                };
            })
            .OrderByDescending(c => c.DeliveredCount)
            .ToList();

        return new FulfillmentAnalyticsDto
        {
            AverageDeliveryHours = avgDeliveryHours,
            DelayRate = delayRate,
            TotalShipments = total,
            DeliveredCount = delivered.Count,
            FailedCount = failed,
            CourierPerformance = courierPerf,
        };
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────
    private async Task<Guid> GetMerchantIdAsync()
    {
        if (_currentUser.MerchantId.HasValue)
            return _currentUser.MerchantId.Value;

        var merchant =
            await _db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId)
            ?? throw new InvalidOperationException("Merchant profili bulunamadı.");

        return merchant.Id;
    }

    private static DateTime PeriodToDate(string period) =>
        period.ToLower() switch
        {
            "daily" => DateTime.UtcNow.AddDays(-1),
            "weekly" => DateTime.UtcNow.AddDays(-7),
            _ => DateTime.UtcNow.AddDays(-30),
        };
}
