namespace api.Infrastructure.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string Role { get; }
    Guid? MerchantId { get; }
}
