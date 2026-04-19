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

    /// <summary>
    /// ETA'yı saat cinsinden döner. FulfillmentController'daki
    /// /calculate-eta endpoint'i için kullanılır.
    /// </summary>
    int CalculateEtaHours(
        double merchantLat,
        double merchantLng,
        double destLat,
        double destLng,
        int handlingHours,
        ShippingRate rate
    );
}
