using api.Domain.Entities;

namespace api.Infrastructure.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetByIdWithCategoryAsync(Guid productId, CancellationToken ct = default);

    Task<(IReadOnlyList<Product> Items, int TotalCount)> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        string? sortBy,
        int page,
        int limit,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<Product>> GetFeaturedAsync(int limit, CancellationToken ct = default);

    Task<IReadOnlyList<Product>> GetByMerchantAsync(
        Guid merchantId,
        CancellationToken ct = default
    );
}
