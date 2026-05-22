using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace api.Infrastructure.Services;

/// <summary>
/// Redis-based distributed stock reservation.
///
/// ALGORITHM
/// ─────────
/// Available stock is tracked in a Redis HASH:
///   Key  : stock:available:{entityId}
///   Field: qty        → int (available units)
///
/// On Reserve:
///   1. WATCH stock:available:{id}:qty
///   2. Read current available
///   3. If available >= requested → MULTI / DECRBY / SET reservation key / EXEC
///   4. On EXEC failure (concurrent modification) → retry once
///
/// On Release:
///   1. Read reservation key to get quantity
///   2. INCR stock:available:{id}:qty
///   3. DEL reservation key
///
/// Redis key lifecycle:
///   Reservation key TTL = caller-supplied or 10 minutes.
///   The available-qty key has NO TTL (persistent until deliberately seeded/reset).
///
/// INITIALISATION:
///   When the available-qty key is absent, the service falls back to the DB stock value.
///   A background startup or seeding step should call SeedAvailableStockAsync per item.
/// </summary>
public class StockReservationService : IStockReservationService
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(10);

    private readonly IConnectionMultiplexer _redis;
    private readonly AppDbContext _db;
    private readonly ILogger<StockReservationService> _logger;

    public StockReservationService(
        IConnectionMultiplexer redis,
        AppDbContext db,
        ILogger<StockReservationService> logger)
    {
        _redis  = redis;
        _db     = db;
        _logger = logger;
    }

    // ── IStockReservationService ───────────────────────────────────────────────

    public async Task<string> ReserveAsync(
        Guid productId,
        Guid? variantId,
        int quantity,
        TimeSpan? ttl = null,
        CancellationToken ct = default)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));

        var db           = _redis.GetDatabase();
        var entityId     = variantId ?? productId;
        var availableKey = AvailableKey(entityId);
        var effectiveTtl = ttl ?? DefaultTtl;

        // Ensure the available-qty key exists (seed from DB on first access)
        await EnsureSeedAsync(db, entityId, productId, variantId);

        // Optimistic locking loop (at most 3 attempts)
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            var tran = db.CreateTransaction();

            // Read current value outside the transaction for the guard
            var currentRaw = await db.StringGetAsync(availableKey);
            var current    = currentRaw.HasValue ? (int)currentRaw : 0;

            if (current < quantity)
            {
                _logger.LogWarning(
                    "Stock reservation failed: product={ProductId} variant={VariantId} " +
                    "requested={Requested} available={Available}",
                    productId, variantId, quantity, current);

                throw new StockReservationException(productId, variantId, quantity, current);
            }

            // Guard: abort transaction if value changed between read and exec
            tran.AddCondition(Condition.StringEqual(availableKey, current));

            var reservationId  = Guid.NewGuid().ToString("N");
            var reservationKey = ReservationKey(entityId, reservationId);

            // Within the transaction: decrement available + store reservation record
            _ = tran.StringDecrementAsync(availableKey, quantity);
            _ = tran.StringSetAsync(
                reservationKey,
                quantity.ToString(),
                effectiveTtl);

            if (await tran.ExecuteAsync())
            {
                _logger.LogDebug(
                    "Stock reserved: product={ProductId} variant={VariantId} " +
                    "qty={Qty} token={Token} ttl={Ttl}",
                    productId, variantId, quantity, reservationId, effectiveTtl);

                return reservationId;
            }

            // Concurrent modification — small back-off before retry
            await Task.Delay(50 * attempt, ct);
        }

        throw new StockReservationException(productId, variantId, quantity, 0);
    }

    public async Task ReleaseAsync(
        Guid productId,
        Guid? variantId,
        string reservationToken,
        CancellationToken ct = default)
    {
        var db           = _redis.GetDatabase();
        var entityId     = variantId ?? productId;
        var reservationKey = ReservationKey(entityId, reservationToken);

        var qtyRaw = await db.StringGetAsync(reservationKey);

        if (!qtyRaw.HasValue)
        {
            // Already expired or already released — idempotent, do nothing
            _logger.LogDebug(
                "Release no-op (key missing): product={ProductId} token={Token}",
                productId, reservationToken);
            return;
        }

        var qty = (int)qtyRaw;

        // Restore stock atomically
        var tran = db.CreateTransaction();
        tran.AddCondition(Condition.KeyExists(reservationKey));
        _ = tran.StringIncrementAsync(AvailableKey(entityId), qty);
        _ = tran.KeyDeleteAsync(reservationKey);
        await tran.ExecuteAsync();

        _logger.LogDebug(
            "Stock released: product={ProductId} variant={VariantId} qty={Qty} token={Token}",
            productId, variantId, qty, reservationToken);
    }

    public async Task<int> GetReservedQuantityAsync(
        Guid productId,
        Guid? variantId,
        CancellationToken ct = default)
    {
        var db       = _redis.GetDatabase();
        var entityId = variantId ?? productId;

        // Actual DB stock minus what is currently available = reserved
        var dbStock    = await GetDbStockAsync(productId, variantId);
        var available  = await db.StringGetAsync(AvailableKey(entityId));
        var availableN = available.HasValue ? (int)available : dbStock;

        return Math.Max(0, dbStock - availableN);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private async Task EnsureSeedAsync(
        IDatabase db,
        Guid entityId,
        Guid productId,
        Guid? variantId)
    {
        var key = AvailableKey(entityId);

        // Only seed when the key is absent (first request for this item)
        if (await db.KeyExistsAsync(key)) return;

        var stock = await GetDbStockAsync(productId, variantId);

        // SET NX — only sets if not already present (race-safe)
        await db.StringSetAsync(key, stock, when: When.NotExists);
    }

    private async Task<int> GetDbStockAsync(Guid productId, Guid? variantId)
    {
        if (variantId.HasValue)
        {
            var variant = await _db.ProductVariants
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == variantId.Value);
            return variant?.Stock ?? 0;
        }

        var product = await _db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId);
        return product?.Stock ?? 0;
    }

    private static string AvailableKey(Guid entityId)    => $"stock:available:{entityId}";
    private static string ReservationKey(Guid entityId, string token)
        => $"stock:reservation:{entityId}:{token}";
}
