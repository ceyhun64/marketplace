using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Admin;

public record GetAdminDashboardQuery : IRequest<AdminDashboardResult>;

public record AdminDashboardResult(
    AdminOrderStats Orders,
    AdminRevenueStats Revenue,
    AdminMerchantStats Merchants,
    int TotalUsers,
    int PendingProducts,
    int ActiveShipments,
    int TotalProducts,
    int PendingMerchants,
    decimal TotalRevenue
);

public record AdminOrderStats(int TotalOrders, int OrdersToday, int OrdersThisMonth);

public record AdminRevenueStats(decimal RevenueThisMonth);

public record AdminMerchantStats(int TotalMerchants, int ActiveMerchants);

public class GetAdminDashboardQueryHandler
    : IRequestHandler<GetAdminDashboardQuery, AdminDashboardResult>
{
    private readonly AppDbContext _db;

    public GetAdminDashboardQueryHandler(AppDbContext db) => _db = db;

    public async Task<AdminDashboardResult> Handle(
        GetAdminDashboardQuery request,
        CancellationToken cancellationToken
    )
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfDay = now.Date.ToUniversalTime();

        var totalOrders = await _db.Orders.CountAsync(cancellationToken);
        var ordersToday = await _db.Orders.CountAsync(
            o => o.CreatedAt >= startOfDay,
            cancellationToken
        );
        var ordersThisMonth = await _db.Orders.CountAsync(
            o => o.CreatedAt >= startOfMonth,
            cancellationToken
        );
        var revenueThisMonth =
            await _db
                .Orders.Where(o => o.CreatedAt >= startOfMonth && o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken)
            ?? 0;
        var totalMerchants = await _db.MerchantProfiles.CountAsync(cancellationToken);
        var activeMerchants = await _db.MerchantProfiles.CountAsync(
            m => m.IsActive,
            cancellationToken
        );
        var totalUsers = await _db.Users.CountAsync(cancellationToken);
        var pendingProducts = await _db.Products.CountAsync(
            p => !p.IsApproved && !p.IsDeleted,
            cancellationToken
        );
        var activeShipments = await _db.Shipments.CountAsync(
            s => s.Status != ShipmentStatus.Delivered && s.Status != ShipmentStatus.Failed,
            cancellationToken
        );
        var totalProducts = await _db.Products.CountAsync(
            p => !p.IsDeleted,
            cancellationToken
        );
        var pendingMerchants = await _db.Users.CountAsync(
            u => u.Role == UserRole.Merchant && u.AccountStatus == AccountStatus.PendingApproval && !u.IsDeleted,
            cancellationToken
        );
        var totalRevenue =
            await _db.Orders
                .Where(o => o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken)
            ?? 0;

        return new AdminDashboardResult(
            new AdminOrderStats(totalOrders, ordersToday, ordersThisMonth),
            new AdminRevenueStats(revenueThisMonth),
            new AdminMerchantStats(totalMerchants, activeMerchants),
            totalUsers,
            pendingProducts,
            activeShipments,
            totalProducts,
            pendingMerchants,
            totalRevenue
        );
    }
}
