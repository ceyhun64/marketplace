namespace api.Infrastructure.Services;

public interface IBuyBoxService
{
    /// <summary>
    /// Returns the winning ProductOffer ID for a given product
    /// based on price, rating, ETA, and stock availability.
    /// </summary>
    Task<Guid?> GetWinningOfferAsync(Guid productId, double customerLat, double customerLng);
}
