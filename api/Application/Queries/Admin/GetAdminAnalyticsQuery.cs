using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Admin;

public record GetAdminAnalyticsQuery(string Period) : IRequest<AdminAnalyticsResult>;

public record DailyOrderStat(DateTime Date, int Count, decimal Revenue);

public record AdminAnalyticsResult(
    string Period,
    decimal Revenue,
    int OrderCount,
    int NewUsers,
    IEnumerable<DailyOrderStat> DailyOrders
);

public class GetAdminAnalyticsQueryHandler
    : IRequestHandler<GetAdminAnalyticsQuery, AdminAnalyticsResult>
{
    private readonly AppDbContext _db;

    public GetAdminAnalyticsQueryHandler(AppDbContext db) => _db = db;

    public async Task<AdminAnalyticsResult> Handle(
        GetAdminAnalyticsQuery request,
        CancellationToken cancellationToken
    )
    {
        var from = request.Period switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "year" => DateTime.UtcNow.AddDays(-365),
            _ => DateTime.UtcNow.AddDays(-30),
        };

        var revenue =
            await _db
                .Orders.Where(o => o.CreatedAt >= from && o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken)
            ?? 0;

        var orderCount = await _db.Orders.CountAsync(o => o.CreatedAt >= from, cancellationToken);
        var newUsers = await _db.Users.CountAsync(u => u.CreatedAt >= from, cancellationToken);

        var dailyOrders = await _db
            .Orders.Where(o => o.CreatedAt >= from)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new DailyOrderStat(g.Key, g.Count(), g.Sum(o => o.TotalAmount)))
            .OrderBy(g => g.Date)
            .ToListAsync(cancellationToken);

        return new AdminAnalyticsResult(request.Period, revenue, orderCount, newUsers, dailyOrders);
    }
}
