namespace api.Infrastructure.Services;

/// <summary>
/// Redis-backed stock reservation service.
///
/// Flow:
///   1. User enters checkout → <see cref="ReserveAsync"/> locks stock for 10 minutes.
///   2. Payment succeeds → caller decrements real DB stock and calls <see cref="ReleaseAsync"/>.
///   3. Payment fails / TTL expires → <see cref="ReleaseAsync"/> or automatic Redis expiry frees the lock.
///
/// Redis key format: stock:reservation:{productOrVariantId}:{reservationId}
/// Global available-stock key: stock:available:{productOrVariantId}
/// </summary>
public interface IStockReservationService
{
    /// <summary>
    /// Attempts to reserve <paramref name="quantity"/> units of the given SKU.
    /// Returns a reservation token to be stored by the caller for later release.
    /// Throws <see cref="StockReservationException"/> when there is insufficient stock.
    /// </summary>
    Task<string> ReserveAsync(
        Guid productId,
        Guid? variantId,
        int quantity,
        TimeSpan? ttl = null,
        CancellationToken ct = default);

    /// <summary>
    /// Releases a previously obtained reservation identified by <paramref name="reservationToken"/>.
    /// Safe to call multiple times (idempotent).
    /// </summary>
    Task ReleaseAsync(
        Guid productId,
        Guid? variantId,
        string reservationToken,
        CancellationToken ct = default);

    /// <summary>
    /// Returns the quantity currently reserved (not yet released) for a given item.
    /// Useful for dashboards and availability checks.
    /// </summary>
    Task<int> GetReservedQuantityAsync(Guid productId, Guid? variantId, CancellationToken ct = default);
}

/// <summary>Thrown when a stock reservation cannot be fulfilled due to insufficient available stock.</summary>
public sealed class StockReservationException : Exception
{
    public Guid ProductId  { get; }
    public Guid? VariantId { get; }
    public int   Requested { get; }
    public int   Available { get; }

    public StockReservationException(Guid productId, Guid? variantId, int requested, int available)
        : base($"Insufficient stock for product {productId}: requested {requested}, available {available}.")
    {
        ProductId = productId;
        VariantId = variantId;
        Requested = requested;
        Available = available;
    }
}
