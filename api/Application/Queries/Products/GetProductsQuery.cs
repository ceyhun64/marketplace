using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Products;

// ── Request ───────────────────────────────────────────────────────────────────
public record GetProductsQuery(
    string? Search = null,
    Guid? CategoryId = null,
    bool? IsApproved = null,
    int Page = 1,
    int Limit = 20
) : IRequest<GetProductsResult>;

// ── DTOs ──────────────────────────────────────────────────────────────────────
public record ProductSummaryDto(
    Guid Id,
    string Name,
    string Description,
    string CategoryName,
    bool IsApproved,
    int OfferCount,
    DateTime CreatedAt
);

public record GetProductsResult(List<ProductSummaryDto> Items, int Total, int Page, int TotalPages);

// ── Handler ───────────────────────────────────────────────────────────────────
public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, GetProductsResult>
{
    private readonly AppDbContext _db;

    public GetProductsQueryHandler(AppDbContext db) => _db = db;

    public async Task<GetProductsResult> Handle(
        GetProductsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _db.Products.Include(p => p.Category).Include(p => p.Offers).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p =>
                p.Name.ToLower().Contains(request.Search.ToLower())
                || p.Description.ToLower().Contains(request.Search.ToLower())
            );

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        if (request.IsApproved.HasValue)
            query = query.Where(p => p.IsApproved == request.IsApproved.Value);

        int total = await query.CountAsync(cancellationToken);
        int totalPages = (int)Math.Ceiling(total / (double)request.Limit);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .Select(p => new ProductSummaryDto(
                p.Id,
                p.Name,
                p.Description,
                p.Category != null ? p.Category.Name : "",
                p.IsApproved,
                p.Offers.Count,
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new GetProductsResult(items, total, request.Page, totalPages);
    }
}
