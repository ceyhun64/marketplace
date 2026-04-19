using System.Text.Json;
using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Infrastructure.Services;

/// <summary>
/// Kazanan merchant teklifini ağırlıklı skorlama modeliyle seçer:
///   Fiyat 40% · Rating 30% · ETA 20% · Stok 10%
/// Sonuçlar Redis'te 5 dakika TTL ile ürün + müşteri bölgesi başına cache'lenir.
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

    public async Task<BuyBoxOfferDto?> GetWinningOfferAsync(
        Guid productId,
        double? customerLat = null,
        double? customerLng = null
    )
    {
        var region = customerLat.HasValue
            ? $"{Math.Round(customerLat.Value, 1)}_{Math.Round(customerLng!.Value, 1)}"
            : "any";
        var cacheKey = $"buybox:{productId}:{region}";

        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null)
            return JsonSerializer.Deserialize<BuyBoxOfferDto>(cached);

        var (scored, _) = await ScoreOffersAsync(productId, customerLat, customerLng);
        if (scored.Count == 0)
            return null;

        var winner = scored.OrderByDescending(x => x.score).First();
        var result = ToDto(winner.offer, winner.score, winner.etaHours);

        await _cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(result),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
            }
        );

        return result;
    }

    public async Task<List<BuyBoxOfferDto>> GetAllOffersAsync(
        Guid productId,
        double? customerLat = null,
        double? customerLng = null
    )
    {
        var (scored, _) = await ScoreOffersAsync(productId, customerLat, customerLng);

        return scored
            .OrderBy(x => x.offer.Price)
            .Select(x => ToDto(x.offer, score: 0, x.etaHours)) // listelemede skor gösterilmez
            .ToList();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<(
        List<(Domain.Entities.ProductOffer offer, double score, int etaHours)>,
        int total
    )> ScoreOffersAsync(Guid productId, double? customerLat, double? customerLng)
    {
        var offers = await _db
            .ProductOffers.Include(o => o.Merchant)
            .Where(o => o.ProductId == productId && o.PublishToMarket && o.Stock > 0)
            .ToListAsync();

        if (offers.Count == 0)
            return ([], 0);

        // Normalize için min/max fiyat
        var minPrice = (double)offers.Min(o => o.Price);
        var maxPrice = (double)offers.Max(o => o.Price);
        var priceRange = maxPrice - minPrice == 0 ? 1 : maxPrice - minPrice;

        var result = new List<(Domain.Entities.ProductOffer, double, int)>();

        foreach (var offer in offers)
        {
            var etaHours = 48; // koordinat yoksa default
            if (customerLat.HasValue && customerLng.HasValue && offer.Merchant != null)
            {
                etaHours = _shipping.CalculateEtaHours(
                    offer.Merchant.Latitude,
                    offer.Merchant.Longitude,
                    customerLat.Value,
                    customerLng.Value,
                    offer.Merchant.HandlingHours,
                    ShippingRate.Regular
                );
            }

            // Lower price → higher score (invert)
            var normalizedPrice = 1.0 - ((double)offer.Price - minPrice) / priceRange;
            var normalizedRating = offer.Rating / 5.0;
            // Lower ETA → higher score, cap at 168h (1 hafta)
            var normalizedEta = 1.0 - Math.Min(etaHours, 168) / 168.0;

            var score =
                normalizedPrice * 0.40 + normalizedRating * 0.30 + normalizedEta * 0.20 + 0.10; // stok var (zaten filtrelendi)

            result.Add((offer, score, etaHours));
        }

        return (result, offers.Count);
    }

    private static BuyBoxOfferDto ToDto(
        Domain.Entities.ProductOffer offer,
        double score,
        int etaHours
    ) =>
        new()
        {
            OfferId = offer.Id,
            MerchantId = offer.Merchant!.Id,
            MerchantStoreName = offer.Merchant.StoreName ?? "",
            MerchantSlug = offer.Merchant.Slug,
            Price = offer.Price,
            Stock = offer.Stock,
            Rating = offer.Rating,
            Score = Math.Round(score, 4),
            EstimatedDeliveryHours = etaHours,
            EstimatedDeliveryDate = DateTime.UtcNow.AddHours(etaHours),
        };
}
