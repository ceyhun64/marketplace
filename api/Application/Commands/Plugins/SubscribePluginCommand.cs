using api.Common.DTOs;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Plugins;

public record SubscribePluginCommand(Guid PluginId) : IRequest<SubscribePluginResult>;

public record SubscribePluginResult(bool Success, string Message, MerchantPluginDto? Data = null);

public class SubscribePluginCommandHandler : IRequestHandler<SubscribePluginCommand, SubscribePluginResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public SubscribePluginCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<SubscribePluginResult> Handle(SubscribePluginCommand request, CancellationToken cancellationToken)
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return new SubscribePluginResult(false, "Merchant profili bulunamadı.");

        var plugin = await _db.Plugins
            .FirstOrDefaultAsync(p => p.Id == request.PluginId && p.IsActive, cancellationToken);

        if (plugin == null)
            return new SubscribePluginResult(false, "Plugin bulunamadı veya aktif değil.");

        // Check if already subscribed
        var existing = await _db.MerchantPlugins
            .FirstOrDefaultAsync(
                mp => mp.MerchantId == merchantId && mp.PluginId == request.PluginId,
                cancellationToken
            );

        if (existing != null)
        {
            if (existing.IsActive)
                return new SubscribePluginResult(false, "Bu plugin'e zaten abonesiniz.");

            // Re-activate
            existing.IsActive = true;
            existing.SubscribedAt = DateTime.UtcNow;
            existing.ExpiresAt = DateTime.UtcNow.AddMonths(1);
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Check merchant subscription plan allows plugin
            var merchant = await _db.MerchantProfiles
                .Include(m => m.Subscription)
                .FirstOrDefaultAsync(m => m.Id == merchantId, cancellationToken);

            if (merchant?.Subscription == null)
                return new SubscribePluginResult(false, "Aktif bir abonelik planı gereklidir.");

            var merchantPlugin = new MerchantPlugin
            {
                MerchantId = merchantId.Value,
                PluginId = request.PluginId,
                IsActive = true,
                SubscribedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMonths(1),
                AutoRenew = true,
            };
            _db.MerchantPlugins.Add(merchantPlugin);
        }

        await _db.SaveChangesAsync(cancellationToken);

        var result = new MerchantPluginDto
        {
            PluginId = plugin.Id,
            PluginName = plugin.Name,
            PluginSlug = plugin.Slug,
            PluginIconUrl = plugin.IconUrl,
            IsActive = true,
            SubscribedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMonths(1),
            AutoRenew = true,
        };

        return new SubscribePluginResult(true, "Plugin aboneliği başarıyla oluşturuldu.", result);
    }
}