using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Admin;

public record GetAdminOrdersQuery(int Page, int Limit, string? Status, Guid? MerchantId)
    : IRequest<AdminOrdersResult>;

public record AdminOrderItem(
    Guid Id,
    OrderStatus Status,
    decimal TotalAmount,
    OrderSource Source,
    DateTime CreatedAt,
    AdminOrderCustomer Customer,
    int ItemCount
);

public record AdminOrderCustomer(Guid Id, string Email);

public record AdminOrdersResult(int Total, int Page, int Limit, IEnumerable<AdminOrderItem> Items);

public class GetAdminOrdersQueryHandler : IRequestHandler<GetAdminOrdersQuery, AdminOrdersResult>
{
    private readonly AppDbContext _db;

    public GetAdminOrdersQueryHandler(AppDbContext db) => _db = db;

    public async Task<AdminOrdersResult> Handle(
        GetAdminOrdersQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _db.Orders.Include(o => o.Customer).Include(o => o.Items).AsQueryable();

        if (
            !string.IsNullOrEmpty(request.Status)
            && Enum.TryParse<OrderStatus>(request.Status, true, out var ps)
        )
            query = query.Where(o => o.Status == ps);

        if (request.MerchantId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.MerchantId == request.MerchantId.Value));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .Select(o => new AdminOrderItem(
                o.Id,
                o.Status,
                o.TotalAmount,
                o.Source,
                o.CreatedAt,
                new AdminOrderCustomer(o.Customer.Id, o.Customer.Email),
                o.Items.Count
            ))
            .ToListAsync(cancellationToken);

        return new AdminOrdersResult(total, request.Page, request.Limit, items);
    }
}
