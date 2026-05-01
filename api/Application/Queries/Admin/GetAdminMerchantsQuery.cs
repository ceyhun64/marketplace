using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Admin;

public record GetAdminMerchantsQuery(int Page, int Limit, string? Search, bool? IsActive)
    : IRequest<AdminMerchantsResult>;

public record AdminMerchantItem(
    Guid Id,
    string StoreName,
    string Slug,
    bool IsActive,
    DateTime CreatedAt,
    AdminMerchantUser User,
    string? Plan,
    int ProductCount,
    string? CustomDomain,
    bool DomainVerified
);

public record AdminMerchantUser(Guid Id, string Email);

public record AdminMerchantsResult(
    int Total,
    int Page,
    int Limit,
    IEnumerable<AdminMerchantItem> Items
);

public class GetAdminMerchantsQueryHandler
    : IRequestHandler<GetAdminMerchantsQuery, AdminMerchantsResult>
{
    private readonly AppDbContext _db;

    public GetAdminMerchantsQueryHandler(AppDbContext db) => _db = db;

    public async Task<AdminMerchantsResult> Handle(
        GetAdminMerchantsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _db
            .MerchantProfiles.Include(m => m.User)
            .Include(m => m.Subscription)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Search))
            query = query.Where(m =>
                EF.Functions.ILike(m.StoreName, $"%{request.Search}%")
                || EF.Functions.ILike(m.User.Email, $"%{request.Search}%")
            );

        if (request.IsActive.HasValue)
            query = query.Where(m => m.IsActive == request.IsActive.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .Select(m => new AdminMerchantItem(
                m.Id,
                m.StoreName,
                m.Slug,
                m.IsActive,
                m.CreatedAt,
                new AdminMerchantUser(m.User.Id, m.User.Email),
                m.Subscription == null ? null : m.Subscription.Plan.ToString(),
                m.Products.Count(p => !p.IsDeleted),
                m.CustomDomain,
                m.DomainVerified
            ))
            .ToListAsync(cancellationToken);

        return new AdminMerchantsResult(total, request.Page, request.Limit, items);
    }
}
