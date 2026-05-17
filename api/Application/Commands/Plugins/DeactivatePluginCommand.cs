using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Plugins;

/// <summary>
/// Plugin'i geçici olarak deaktive eder.
/// UnsubscribePluginCommand'ın aksine abonelik kaydını SİLMEZ ve AutoRenew'u değiştirmez;
/// yalnızca IsActive=false yapar. Merchant daha sonra plugin'i yeniden aktive edebilir.
/// </summary>
public record DeactivatePluginCommand(Guid PluginId) : IRequest<DeactivatePluginResult>;

public record DeactivatePluginResult(bool Success, string Message);

public class DeactivatePluginCommandHandler
    : IRequestHandler<DeactivatePluginCommand, DeactivatePluginResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeactivatePluginCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<DeactivatePluginResult> Handle(
        DeactivatePluginCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return new DeactivatePluginResult(false, "Merchant profili bulunamadı.");

        var merchantPlugin = await _db.MerchantPlugins.FirstOrDefaultAsync(
            mp => mp.MerchantId == merchantId && mp.PluginId == request.PluginId && mp.IsActive,
            cancellationToken
        );

        if (merchantPlugin == null)
            return new DeactivatePluginResult(false, "Aktif plugin aboneliği bulunamadı.");

        // Sadece deaktive et — abonelik kaydı ve AutoRenew korunur
        merchantPlugin.IsActive = false;
        merchantPlugin.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new DeactivatePluginResult(true, "Plugin geçici olarak deaktive edildi.");
    }
}
