using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Plugins;

public record UnsubscribePluginCommand(Guid PluginId) : IRequest<UnsubscribePluginResult>;

public record UnsubscribePluginResult(bool Success, string Message);

public class UnsubscribePluginCommandHandler
    : IRequestHandler<UnsubscribePluginCommand, UnsubscribePluginResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UnsubscribePluginCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UnsubscribePluginResult> Handle(
        UnsubscribePluginCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return new UnsubscribePluginResult(false, "Merchant profili bulunamadı.");

        var merchantPlugin = await _db.MerchantPlugins.FirstOrDefaultAsync(
            mp => mp.MerchantId == merchantId && mp.PluginId == request.PluginId && mp.IsActive,
            cancellationToken
        );

        if (merchantPlugin == null)
            return new UnsubscribePluginResult(false, "Aktif plugin aboneliği bulunamadı.");

        merchantPlugin.IsActive = false;
        merchantPlugin.AutoRenew = false;
        merchantPlugin.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new UnsubscribePluginResult(true, "Plugin aboneliği iptal edildi.");
    }
}
