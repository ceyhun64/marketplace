using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Plugins;

public record UpdatePluginConfigCommand(Guid PluginId, string? Config, bool? AutoRenew)
    : IRequest<UpdatePluginConfigResult>;

public record UpdatePluginConfigResult(bool Success, string Message);

public class UpdatePluginConfigCommandHandler
    : IRequestHandler<UpdatePluginConfigCommand, UpdatePluginConfigResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdatePluginConfigCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UpdatePluginConfigResult> Handle(
        UpdatePluginConfigCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return new UpdatePluginConfigResult(false, "Merchant profili bulunamadı.");

        var merchantPlugin = await _db.MerchantPlugins.FirstOrDefaultAsync(
            mp => mp.MerchantId == merchantId && mp.PluginId == request.PluginId && mp.IsActive,
            cancellationToken
        );

        if (merchantPlugin == null)
            return new UpdatePluginConfigResult(false, "Aktif plugin aboneliği bulunamadı.");

        if (request.Config != null)
            merchantPlugin.Config = request.Config;

        if (request.AutoRenew.HasValue)
            merchantPlugin.AutoRenew = request.AutoRenew.Value;

        merchantPlugin.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return new UpdatePluginConfigResult(true, "Plugin yapılandırması güncellendi.");
    }
}
