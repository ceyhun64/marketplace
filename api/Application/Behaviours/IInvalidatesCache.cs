namespace api.Application.Behaviours;

/// <summary>
/// Marker interface for MediatR requests that should invalidate Redis cache keys
/// after they are successfully handled.
///
/// Usage:
///   public record UpdateProductCommand(...) : IRequest<...>, IInvalidatesCache
///   {
///       public string[] CacheKeys => [$"product:{ProductId}", $"products:merchant:{MerchantId}"];
///   }
/// </summary>
public interface IInvalidatesCache
{
    string[] CacheKeys { get; }
}
