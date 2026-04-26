using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Plugins;

// ── Request ───────────────────────────────────────────────────────────────────
public record GetMerchantPluginsQuery() : IRequest<List<MerchantPluginDto>>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class GetMerchantPluginsQueryHandler
    : IRequestHandler<GetMerchantPluginsQuery, List<MerchantPluginDto>>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMerchantPluginsQueryHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<MerchantPluginDto>> Handle(
        GetMerchantPluginsQuery request,
        CancellationToken cancellationToken
    )
    {
        var merchantId = _currentUser.MerchantId;
        if (merchantId == null)
            return new List<MerchantPluginDto>();

        var merchantPlugins = await _db
            .MerchantPlugins.AsNoTracking()
            .Include(mp => mp.Plugin)
            .Where(mp => mp.MerchantId == merchantId && mp.IsActive)
            .OrderByDescending(mp => mp.SubscribedAt)
            .Select(mp => new MerchantPluginDto
            {
                Id = mp.Id,
                PluginId = mp.PluginId,
                PluginName = mp.Plugin != null ? mp.Plugin.Name : string.Empty,
                PluginSlug = mp.Plugin != null ? mp.Plugin.Slug : string.Empty,
                PluginIconUrl = mp.Plugin != null ? mp.Plugin.IconUrl : null,
                IsActive = mp.IsActive,
                Config = mp.Config,
                SubscribedAt = mp.SubscribedAt,
                ExpiresAt = mp.ExpiresAt,
                AutoRenew = mp.AutoRenew,
            })
            .ToListAsync(cancellationToken);

        return merchantPlugins;
    }
}
