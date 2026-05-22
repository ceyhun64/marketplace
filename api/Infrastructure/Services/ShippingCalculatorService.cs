using api.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace api.Infrastructure.Services;

public class ShippingCalculatorService : IShippingCalculatorService
{
    private const double EarthRadiusKm = 6371.0;

    private readonly decimal _flatStandard;
    private readonly decimal _flatExpress;
    private readonly decimal _freeThreshold;
    private readonly decimal _volumetricDivisor;
    private readonly IReadOnlyList<WeightTier> _tiers;

    public ShippingCalculatorService(IConfiguration config)
    {
        var section = config.GetSection("Shipping");

        _flatStandard       = section.GetValue("StandardCost", 29.90m);
        _flatExpress        = section.GetValue("ExpressCost",  59.90m);
        _freeThreshold      = section.GetValue("FreeShippingThreshold", 500m);
        _volumetricDivisor  = section.GetValue("DivisorForVolumetric", 3000m);

        _tiers = section.GetSection("WeightTiers")
            .Get<List<WeightTierConfig>>()
            ?.Select(t => new WeightTier(t.MaxKg, t.StandardCost, t.ExpressCost))
            .OrderBy(t => t.MaxKg)
            .ToList()
            ?? [];
    }

    // ── Interface implementation ───────────────────────────────────────────────

    /// <summary>Haversine formula — straight-line distance in km.</summary>
    public double CalculateDistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);

        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRad(lat1))
                * Math.Cos(ToRad(lat2))
                * Math.Sin(dLng / 2)
                * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    /// <summary>ETA = now + handlingHours + transit time.</summary>
    public DateTime CalculateEta(
        double merchantLat,
        double merchantLng,
        double destLat,
        double destLng,
        int handlingHours,
        ShippingRate rate
    )
    {
        var distanceKm = CalculateDistanceKm(merchantLat, merchantLng, destLat, destLng);

        double avgSpeedKmH      = rate == ShippingRate.Express ? 80.0 : 50.0;
        double bufferMultiplier = rate == ShippingRate.Express ? 1.0  : 1.2;

        double transitHours = distanceKm / avgSpeedKmH * bufferMultiplier;
        return DateTime.UtcNow.AddHours(handlingHours).AddHours(transitHours);
    }

    public int CalculateEtaHours(
        double merchantLat,
        double merchantLng,
        double destLat,
        double destLng,
        int handlingHours,
        ShippingRate rate
    )
    {
        var eta     = CalculateEta(merchantLat, merchantLng, destLat, destLng, handlingHours, rate);
        var hours   = (int)Math.Ceiling((eta - DateTime.UtcNow).TotalHours);
        var minimum = rate == ShippingRate.Express ? 4 : 24;
        return Math.Max(hours, minimum);
    }

    /// <summary>
    /// Tiered pricing based on chargeable weight (max of actual vs volumetric/desi).
    /// Falls back to flat rate when <paramref name="chargeableWeightKg"/> is null.
    /// </summary>
    public decimal CalculateShippingCost(ShippingRate rate, decimal? chargeableWeightKg = null)
    {
        if (chargeableWeightKg is null || _tiers.Count == 0)
            return rate == ShippingRate.Express ? _flatExpress : _flatStandard;

        var kg = chargeableWeightKg.Value;

        foreach (var tier in _tiers)
        {
            if (kg <= tier.MaxKg)
                return rate == ShippingRate.Express ? tier.ExpressCost : tier.StandardCost;
        }

        // Heavier than the last tier — use the last tier's cost
        var last = _tiers[^1];
        return rate == ShippingRate.Express ? last.ExpressCost : last.StandardCost;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Computes volumetric (desi) weight: W × H × L / divisor.
    /// Standard divisor is 3000 for most Turkish domestic carriers.
    /// </summary>
    public decimal CalculateVolumetricWeight(decimal widthCm, decimal heightCm, decimal lengthCm)
        => Math.Round(widthCm * heightCm * lengthCm / _volumetricDivisor, 3);

    /// <summary>Chargeable weight = Max(actual, volumetric).</summary>
    public decimal ChargeableWeight(decimal actualKg, decimal widthCm, decimal heightCm, decimal lengthCm)
    {
        var volumetric = CalculateVolumetricWeight(widthCm, heightCm, lengthCm);
        return Math.Max(actualKg, volumetric);
    }

    private static double ToRad(double degrees) => degrees * (Math.PI / 180.0);

    // ── Inner types ────────────────────────────────────────────────────────────

    private sealed record WeightTier(decimal MaxKg, decimal StandardCost, decimal ExpressCost);

    private sealed class WeightTierConfig
    {
        public decimal MaxKg        { get; set; }
        public decimal StandardCost { get; set; }
        public decimal ExpressCost  { get; set; }
    }
}
