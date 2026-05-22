using api.Application.Commands.Orders;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace api.Application.Behaviours;

/// <summary>
/// MediatR pipeline behaviour that wraps <see cref="CreateOrderCommand"/> with a
/// Redis-based stock reservation / release cycle.
///
/// Lifecycle
/// ─────────
///  1. Before handler: reserve stock for every cart item in Redis (10-min TTL).
///  2. Handler runs (DB stock decremented inside the Serializable transaction).
///  3. Success: release the Redis reservations (handler already decremented DB stock).
///  4. Exception: release all reservations so stock is not stuck for 10 minutes.
///
/// This layer bridges the gap between "user enters checkout" and "order is committed":
/// a flash-sale race condition cannot oversell stock because the reservation
/// claims the units in Redis before the DB transaction starts.
/// </summary>
public class StockReservationBehaviour
    : IPipelineBehavior<CreateOrderCommand, Infrastructure.Services.ServiceResult<Common.DTOs.OrderDto>>
{
    private readonly IStockReservationService _reservation;
    private readonly ILogger<StockReservationBehaviour> _logger;

    public StockReservationBehaviour(
        IStockReservationService reservation,
        ILogger<StockReservationBehaviour> logger)
    {
        _reservation = reservation;
        _logger      = logger;
    }

    public async Task<Infrastructure.Services.ServiceResult<Common.DTOs.OrderDto>> Handle(
        CreateOrderCommand request,
        RequestHandlerDelegate<Infrastructure.Services.ServiceResult<Common.DTOs.OrderDto>> next,
        CancellationToken cancellationToken)
    {
        var tokens = new List<(Guid ProductId, Guid? VariantId, string Token)>();

        // ── Phase 1: Reserve ──────────────────────────────────────────────────
        foreach (var item in request.Request.Items)
        {
            try
            {
                var token = await _reservation.ReserveAsync(
                    item.ProductId,
                    item.VariantId,
                    item.Quantity,
                    ct: cancellationToken);

                tokens.Add((item.ProductId, item.VariantId, token));
            }
            catch (StockReservationException ex)
            {
                // Release any locks already acquired before failing fast
                await ReleaseAllAsync(tokens, cancellationToken);

                return Infrastructure.Services.ServiceResult<Common.DTOs.OrderDto>.Fail(
                    $"Insufficient stock for one or more items: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Stock reservation error: ProductId={ProductId} VariantId={VariantId}",
                    item.ProductId, item.VariantId);

                await ReleaseAllAsync(tokens, cancellationToken);
                return Infrastructure.Services.ServiceResult<Common.DTOs.OrderDto>.Fail(
                    "Stock reservation temporarily unavailable. Please try again.");
            }
        }

        // ── Phase 2: Execute handler ──────────────────────────────────────────
        try
        {
            var result = await next();

            // ── Phase 3a: Success — release reservations (DB already decremented) ─
            await ReleaseAllAsync(tokens, cancellationToken);
            return result;
        }
        catch
        {
            // ── Phase 3b: Failure — release so stock is not blocked ───────────
            await ReleaseAllAsync(tokens, cancellationToken);
            throw;
        }
    }

    private async Task ReleaseAllAsync(
        IEnumerable<(Guid ProductId, Guid? VariantId, string Token)> tokens,
        CancellationToken ct)
    {
        foreach (var (productId, variantId, token) in tokens)
        {
            try
            {
                await _reservation.ReleaseAsync(productId, variantId, token, ct);
            }
            catch (Exception ex)
            {
                // Non-fatal: Redis TTL will expire the reservation automatically
                _logger.LogWarning(ex,
                    "Failed to release stock reservation: ProductId={ProductId} Token={Token}",
                    productId, token);
            }
        }
    }
}
