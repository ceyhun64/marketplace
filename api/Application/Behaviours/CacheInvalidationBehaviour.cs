using MediatR;
using StackExchange.Redis;

namespace api.Application.Behaviours;

/// <summary>
/// MediatR open pipeline behaviour.
/// After any command that implements IInvalidatesCache is successfully handled,
/// this behaviour deletes each declared Redis key to ensure downstream reads
/// always see fresh data.
///
/// Registration in Program.cs:
///   cfg.AddOpenBehavior(typeof(CacheInvalidationBehaviour<,>));
/// </summary>
public class CacheInvalidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<CacheInvalidationBehaviour<TRequest, TResponse>> _logger;

    public CacheInvalidationBehaviour(
        IConnectionMultiplexer redis,
        ILogger<CacheInvalidationBehaviour<TRequest, TResponse>> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Execute the handler first
        var response = await next();

        // Invalidate cache only after successful execution
        if (request is IInvalidatesCache invalidating && invalidating.CacheKeys.Length > 0)
        {
            var db = _redis.GetDatabase();
            foreach (var key in invalidating.CacheKeys)
            {
                try
                {
                    await db.KeyDeleteAsync(key);
                    _logger.LogDebug("Cache invalidated: {Key}", key);
                }
                catch (Exception ex)
                {
                    // Cache invalidation failure must never block the business operation
                    _logger.LogWarning(ex, "Cache invalidation failed for key={Key}", key);
                }
            }
        }

        return response;
    }
}
