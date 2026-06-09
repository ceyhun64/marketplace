using api.Domain.Entities;
using api.Infrastructure.Persistence;

namespace api.Infrastructure.Services;

public class AuditService(AppDbContext db, ILogger<AuditService> logger) : IAuditService
{
    public async Task LogAsync(
        string action,
        string resourceType,
        string resourceId,
        string? oldValue = null,
        string? newValue = null,
        Guid? actorId = null,
        string? actorEmail = null,
        string? ipAddress = null)
    {
        try
        {
            db.AuditLogs.Add(new AuditLog
            {
                Action       = action,
                ResourceType = resourceType,
                ResourceId   = resourceId,
                OldValue     = oldValue,
                NewValue     = newValue,
                ActorId      = actorId,
                ActorEmail   = actorEmail,
                IpAddress    = ipAddress,
                CreatedAt    = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Audit failures must never break the main flow.
            logger.LogError(ex,
                "AuditService: failed to write log — Action={Action} Resource={Type}/{Id}",
                action, resourceType, resourceId);
        }
    }
}
