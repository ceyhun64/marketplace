namespace api.Infrastructure.Services;

public interface IAuditService
{
    Task LogAsync(
        string action,
        string resourceType,
        string resourceId,
        string? oldValue = null,
        string? newValue = null,
        Guid? actorId = null,
        string? actorEmail = null,
        string? ipAddress = null
    );
}
