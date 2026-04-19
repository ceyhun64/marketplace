using api.Domain.Enums;

namespace api.Infrastructure.Services;

public class ShippingCalculatorService : IShippingCalculatorService
{
    private const double EarthRadiusKm = 6371.0;

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

    /// <summary>
    /// ETA = now + handlingHours + transit time.
    /// Express: avg 80 km/h equivalent, Regular: 50 km/h + 20% buffer.
    /// </summary>
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

        double avgSpeedKmH = rate == ShippingRate.Express ? 80.0 : 50.0;
        double bufferMultiplier = rate == ShippingRate.Express ? 1.0 : 1.2;

        double transitHours = (distanceKm / avgSpeedKmH) * bufferMultiplier;

        return DateTime.UtcNow.AddHours(handlingHours).AddHours(transitHours);
    }

    /// <summary>
    /// ETA'yı saat olarak döner — /api/fulfillment/calculate-eta endpoint'i için.
    /// Express minimum 4, Regular minimum 24 saat garantisi vardır.
    /// </summary>
    public int CalculateEtaHours( // ← EKLENDİ
        double merchantLat,
        double merchantLng,
        double destLat,
        double destLng,
        int handlingHours,
        ShippingRate rate
    )
    {
        var eta = CalculateEta(merchantLat, merchantLng, destLat, destLng, handlingHours, rate);
        var hours = (int)Math.Ceiling((eta - DateTime.UtcNow).TotalHours);
        var minimum = rate == ShippingRate.Express ? 4 : 24;
        return Math.Max(hours, minimum);
    }

    private static double ToRad(double degrees) => degrees * (Math.PI / 180.0);
}
