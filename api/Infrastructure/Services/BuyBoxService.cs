using System.Text.Json;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Infrastructure.Services;

/// <summary>
/// Selects the winning merchant offer using a weighted scoring model:
///   Price  40% · Rating 30% · ETA 20% · Stock 10%
/// Results are cached in Redis for 5 minutes per product + customer region.
/// </summary>
public class BuyBoxService : IBuyBoxService
{
    private readonly AppDbContext _db;
    private readonly IShippingCalculatorService _shipping;
    private readonly IDistributedCache _cache;

    public BuyBoxService(
        AppDbContext db,
        IShippingCalculatorService shipping,
        IDistributedCache cache
    )
    {
        _db = db;
        _shipping = shipping;
        _cache = cache;
    }

    public async Task<Guid?> GetWinningOfferAsync(
        Guid productId,
        double customerLat,
        double customerLng
    )
    {
        // Round coords to ~10 km grid for cache key
        var region = $"{Math.Round(customerLat, 1)}_{Math.Round(customerLng, 1)}";
        var cacheKey = $"buybox:{productId}:{region}";

        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached is not null && Guid.TryParse(cached, out var cachedId))
            return cachedId;

        var offers = await _db
            .ProductOffers.Include(o => o.Merchant)
            .Where(o => o.ProductId == productId && o.PublishToMarket && o.Stock > 0)
            .ToListAsync();

        if (offers.Count == 0)
            return null;

        // Normalise price (lower is better → invert)
        var minPrice = (double)offers.Min(o => o.Price);
        var maxPrice = (double)offers.Max(o => o.Price);
        var priceRange = maxPrice - minPrice == 0 ? 1 : maxPrice - minPrice;

        Guid? winner = null;
        double bestScore = double.MinValue;

        foreach (var offer in offers)
        {
            var normalizedPrice = 1.0 - ((double)offer.Price - minPrice) / priceRange;

            var etaHours = (
                _shipping.CalculateEta(
                    offer.Merchant.Latitude,
                    offer.Merchant.Longitude,
                    customerLat,
                    customerLng,
                    offer.Merchant.HandlingHours,
                    ShippingRate.Regular
                ) - DateTime.UtcNow
            ).TotalHours;

            // Lower ETA → higher score (invert, cap at 168 h / 1 week)
            var normalizedEta = 1.0 - Math.Min(etaHours, 168) / 168.0;

            var score =
                normalizedPrice * 0.40 + (offer.Rating / 5.0) * 0.30 + normalizedEta * 0.20 + 0.10; // has stock (already filtered)

            if (score > bestScore)
            {
                bestScore = score;
                winner = offer.Id;
            }
        }

        if (winner.HasValue)
        {
            await _cache.SetStringAsync(
                cacheKey,
                winner.Value.ToString(),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                }
            );
        }

        return winner;
    }
}
