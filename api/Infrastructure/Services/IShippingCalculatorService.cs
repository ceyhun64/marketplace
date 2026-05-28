using api.Domain.Enums;

namespace api.Infrastructure.Services;

public interface IShippingCalculatorService
{
    double CalculateDistanceKm(double lat1, double lng1, double lat2, double lng2);

    DateTime CalculateEta(
        double merchantLat,
        double merchantLng,
        double destLat,
        double destLng,
        int handlingHours,
        ShippingRate rate
    );

    int CalculateEtaHours(
        double merchantLat,
        double merchantLng,
        double destLat,
        double destLng,
        int handlingHours,
        ShippingRate rate
    );

    /// <summary>
    /// Calculates shipping cost using the chargeable weight (the greater of
    /// actual weight and volumetric/desi weight) and the configured weight-tier table.
    /// Falls back to the flat <c>StandardCost</c>/<c>ExpressCost</c> values when
    /// dimensions are unavailable.
    /// </summary>
    /// <param name="chargeableWeightKg">
    /// Max(actualWeightKg, volumetricWeightKg). Pass null to use flat rate.
    /// </param>
    decimal CalculateShippingCost(ShippingRate rate, decimal? chargeableWeightKg = null);

    /// <summary>
    /// Returns the shipping charge for a complete order, applying the configured
    /// free-shipping threshold. Returns 0 when <paramref name="orderSubTotal"/>
    /// meets or exceeds the threshold.
    /// </summary>
    decimal CalculateOrderShipping(decimal orderSubTotal, ShippingRate rate);
}
