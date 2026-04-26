using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Plugins;

// ── Request ───────────────────────────────────────────────────────────────────
public record GetPluginsQuery(
    string? Category = null,
    bool? IsActive = null,
    bool? IsFeatured = null,
    int Page = 1,
    int Limit = 20
) : IRequest<GetPluginsResult>;

public record GetPluginsResult(List<PluginDto> Items, int Total, int Page, int TotalPages);

// ── Handler ───────────────────────────────────────────────────────────────────
public class GetPluginsQueryHandler : IRequestHandler<GetPluginsQuery, GetPluginsResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetPluginsQueryHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetPluginsResult> Handle(
        GetPluginsQuery request,
        CancellationToken cancellationToken
    )
    {
        var merchantId = _currentUser.MerchantId;

        // Collect merchant's subscribed plugin IDs for IsSubscribed flag
        var subscribedPluginIds = merchantId.HasValue
            ? await _db
                .MerchantPlugins.Where(mp => mp.MerchantId == merchantId && mp.IsActive)
                .Select(mp => mp.PluginId)
                .ToListAsync(cancellationToken)
            : new List<Guid>();

        var query = _db.Plugins.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(p => p.Category == request.Category);

        if (request.IsActive.HasValue)
            query = query.Where(p => p.IsActive == request.IsActive.Value);

        if (request.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == request.IsFeatured.Value);

        var total = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling((double)total / request.Limit);

        var plugins = await query
            .OrderByDescending(p => p.IsFeatured)
            .ThenBy(p => p.Name)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .Select(p => new PluginDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                IconUrl = p.IconUrl,
                Category = p.Category,
                MonthlyPrice = p.MonthlyPrice,
                IsActive = p.IsActive,
                IsFeatured = p.IsFeatured,
                MinimumPlan = p.MinimumPlan.ToString(),
                DeveloperName = p.DeveloperName,
                DocumentationUrl = p.DocumentationUrl,
                IsSubscribed = subscribedPluginIds.Contains(p.Id),
                CreatedAt = p.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return new GetPluginsResult(plugins, total, request.Page, totalPages);
    }
}
