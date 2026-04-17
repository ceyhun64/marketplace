using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Repositories;

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext db) : base(db) { }

    public async Task<Product?> GetWithOffersAsync(Guid productId, CancellationToken ct = default)
        => await _set
            .Include(p => p.Offers)
                .ThenInclude(o => o.Merchant)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == productId, ct);

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        string? sortBy,
        int page,
        int limit,
        CancellationToken ct = default)
    {
        var query = _set
            .Include(p => p.Category)
            .Include(p => p.Offers)
            .AsQueryable();

        // Full-text search (PostgreSQL ILIKE)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Description.ToLower().Contains(term) ||
                p.Tags.Any(t => t.ToLower().Contains(term)));
        }

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        // Fiyat filtresi aktif teklifler üzerinden
        if (minPrice.HasValue)
            query = query.Where(p => p.Offers.Any(o => o.Price >= minPrice.Value && o.PublishToMarket));

        if (maxPrice.HasValue)
            query = query.Where(p => p.Offers.Any(o => o.Price <= maxPrice.Value && o.PublishToMarket));

        var totalCount = await query.CountAsync(ct);

        query = sortBy switch
        {
            "price_asc"  => query.OrderBy(p => p.Offers.Where(o => o.PublishToMarket).Min(o => (decimal?)o.Price) ?? decimal.MaxValue),
            "price_desc" => query.OrderByDescending(p => p.Offers.Where(o => o.PublishToMarket).Min(o => (decimal?)o.Price) ?? 0),
            "rating"     => query.OrderByDescending(p => p.Offers.Average(o => (double?)o.Rating) ?? 0),
            "newest"     => query.OrderByDescending(p => p.CreatedAt),
            _            => query.OrderByDescending(p => p.CreatedAt) // default: newest
        };

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<Product>> GetFeaturedAsync(int limit, CancellationToken ct = default)
        => await _set
            .Include(p => p.Offers)
            .Include(p => p.Category)
            .Where(p => p.Offers.Any(o => o.PublishToMarket && o.Stock > 0))
            .OrderByDescending(p => p.Offers.Average(o => (double?)o.Rating) ?? 0)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null, CancellationToken ct = default)
        => await _set.AnyAsync(p =>
            p.Name == slug && (excludeId == null || p.Id != excludeId.Value), ct);
}

public class ProductOfferRepository : Repository<ProductOffer>, IProductOfferRepository
{
    public ProductOfferRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<ProductOffer>> GetByProductAsync(
        Guid productId,
        bool marketplaceOnly = false,
        CancellationToken ct = default)
    {
        var query = _set
            .Include(o => o.Merchant)
            .Where(o => o.ProductId == productId);

        if (marketplaceOnly)
            query = query.Where(o => o.PublishToMarket && o.Stock > 0);

        return await query
            .OrderBy(o => o.Price)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ProductOffer>> GetByMerchantAsync(
        Guid merchantId,
        CancellationToken ct = default)
        => await _set
            .Include(o => o.Product)
                .ThenInclude(p => p.Category)
            .Where(o => o.MerchantId == merchantId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

    public async Task<ProductOffer?> GetByProductAndMerchantAsync(
        Guid productId,
        Guid merchantId,
        CancellationToken ct = default)
        => await _set.FirstOrDefaultAsync(
            o => o.ProductId == productId && o.MerchantId == merchantId, ct);

    public async Task<bool> MerchantOwnsOfferAsync(
        Guid offerId,
        Guid merchantId,
        CancellationToken ct = default)
        => await _set.AnyAsync(o => o.Id == offerId && o.MerchantId == merchantId, ct);
}
