using api.Domain.Entities;

namespace api.Infrastructure.Repositories;

/// <summary>
/// Product ve ProductOffer için özelleşmiş sorgu metodları.
/// </summary>
public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetWithOffersAsync(Guid productId, CancellationToken ct = default);

    Task<(IReadOnlyList<Product> Items, int TotalCount)> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        string? sortBy,
        int page,
        int limit,
        CancellationToken ct = default);

    Task<IReadOnlyList<Product>> GetFeaturedAsync(int limit, CancellationToken ct = default);

    Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null, CancellationToken ct = default);
}

/// <summary>
/// ProductOffer için özelleşmiş sorgu metodları.
/// </summary>
public interface IProductOfferRepository : IRepository<ProductOffer>
{
    Task<IReadOnlyList<ProductOffer>> GetByProductAsync(
        Guid productId,
        bool marketplaceOnly = false,
        CancellationToken ct = default);

    Task<IReadOnlyList<ProductOffer>> GetByMerchantAsync(
        Guid merchantId,
        CancellationToken ct = default);

    Task<ProductOffer?> GetByProductAndMerchantAsync(
        Guid productId,
        Guid merchantId,
        CancellationToken ct = default);

    Task<bool> MerchantOwnsOfferAsync(
        Guid offerId,
        Guid merchantId,
        CancellationToken ct = default);
}
