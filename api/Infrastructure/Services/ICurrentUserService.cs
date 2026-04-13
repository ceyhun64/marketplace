namespace api.Infrastructure.Services;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserRole { get; }
}
