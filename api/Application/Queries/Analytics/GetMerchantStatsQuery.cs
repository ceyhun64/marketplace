using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Analytics;

public record GetMerchantStatsQuery(string Period = "monthly")
    : IRequest<ServiceResult<MerchantStatsDto>>;

public class GetMerchantStatsQueryHandler
    : IRequestHandler<GetMerchantStatsQuery, ServiceResult<MerchantStatsDto>>
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMerchantStatsQueryHandler(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<MerchantStatsDto>> Handle(
        GetMerchantStatsQuery request,
        CancellationToken cancellationToken
    )
    {
        // ✅ Doğru
        if (_currentUser.MerchantId is null)
            return ServiceResult<MerchantStatsDto>.Fail("Merchant profili bulunamadı.");

        var merchantId = _currentUser.MerchantId.Value;
        var now = DateTime.UtcNow;
        var startDate = request.Period switch
        {
            "daily" => now.AddDays(-30),
            "weekly" => now.AddDays(-84),
            "monthly" => now.AddMonths(-12),
            _ => now.AddMonths(-12),
        };

        var orderItems = await _context
            .OrderItems.Include(i => i.Order)
            .Include(i => i.Offer)
            .Where(i =>
                i.Offer.MerchantId == merchantId
                && i.Order.CreatedAt >= startDate
                && i.Order.Status == OrderStatus.Delivered
            )
            .ToListAsync(cancellationToken);

        var marketplaceRevenue = orderItems
            .Where(i => i.Order.Source == OrderSource.Marketplace)
            .Sum(i => i.UnitPrice * i.Quantity);

        var estoreRevenue = orderItems
            .Where(i => i.Order.Source == OrderSource.EStore)
            .Sum(i => i.UnitPrice * i.Quantity);

        var totalOrders = orderItems.Select(i => i.OrderId).Distinct().Count();

        // Günlük/haftalık/aylık grupla
        var salesByPeriod = orderItems
            .GroupBy(i =>
                request.Period switch
                {
                    "daily" => i.Order.CreatedAt.ToString("yyyy-MM-dd"),
                    "weekly" => $"W{System.Globalization.ISOWeek.GetWeekOfYear(i.Order.CreatedAt)}",
                    _ => i.Order.CreatedAt.ToString("yyyy-MM"),
                }
            )
            .Select(g => new SalesPeriodDto
            {
                Label = g.Key,
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity),
                OrderCount = g.Select(i => i.OrderId).Distinct().Count(),
            })
            .OrderBy(g => g.Label)
            .ToList();

        return ServiceResult<MerchantStatsDto>.Ok(
            new MerchantStatsDto
            {
                TotalRevenue = marketplaceRevenue + estoreRevenue,
                MarketplaceRevenue = marketplaceRevenue,
                EstoreRevenue = estoreRevenue,
                TotalOrders = totalOrders,
                AverageOrderValue =
                    totalOrders > 0 ? (marketplaceRevenue + estoreRevenue) / totalOrders : 0,
                SalesByPeriod = salesByPeriod,
            }
        );
    }
}
