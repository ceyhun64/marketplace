using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Repositories;

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext db)
        : base(db) { }

    public async Task<Product?> GetByIdWithCategoryAsync(
        Guid productId,
        CancellationToken ct = default
    ) =>
        await _set.Include(p => p.Category)
            .Include(p => p.Merchant)
            .FirstOrDefaultAsync(p => p.Id == productId, ct);

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        string? sortBy,
        int page,
        int limit,
        CancellationToken ct = default
    )
    {
        var query = _set.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => p.PublishToMarket && p.IsApproved)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term)
                || p.Description.ToLower().Contains(term)
                || p.Tags.Any(t => t.ToLower().Contains(term))
            );
        }

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        var totalCount = await query.CountAsync(ct);

        query = sortBy switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<Product>> GetFeaturedAsync(
        int limit,
        CancellationToken ct = default
    ) =>
        await _set.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Product>> GetByMerchantAsync(
        Guid merchantId,
        CancellationToken ct = default
    ) =>
        await _set.Include(p => p.Category)
            .Where(p => p.MerchantId == merchantId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
}
