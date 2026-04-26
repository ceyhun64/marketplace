using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Plugins;

// ── Update Plugin (Admin) ────────────────────────────────────────────────────

public record UpdateAdminPluginCommand(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    string? IconUrl,
    string Category,
    decimal MonthlyPrice,
    PlanType MinimumPlan,
    string? DeveloperName,
    string? DocumentationUrl,
    bool IsFeatured = false
) : IRequest<CreatePluginResult>;

public class UpdateAdminPluginCommandHandler
    : IRequestHandler<UpdateAdminPluginCommand, CreatePluginResult>
{
    private readonly AppDbContext _db;

    public UpdateAdminPluginCommandHandler(AppDbContext db) => _db = db;

    public async Task<CreatePluginResult> Handle(
        UpdateAdminPluginCommand request,
        CancellationToken cancellationToken
    )
    {
        var plugin = await _db.Plugins.FirstOrDefaultAsync(
            p => p.Id == request.Id,
            cancellationToken
        );

        if (plugin == null)
            return new CreatePluginResult(false, "Plugin bulunamadı.");

        // Slug unique check (excluding self)
        if (
            await _db.Plugins.AnyAsync(
                p => p.Slug == request.Slug && p.Id != request.Id,
                cancellationToken
            )
        )
            return new CreatePluginResult(false, "Bu slug zaten kullanımda.");

        plugin.Name = request.Name;
        plugin.Slug = request.Slug;
        plugin.Description = request.Description;
        plugin.IconUrl = request.IconUrl;
        plugin.Category = request.Category;
        plugin.MonthlyPrice = request.MonthlyPrice;
        plugin.MinimumPlan = request.MinimumPlan;
        plugin.DeveloperName = request.DeveloperName;
        plugin.DocumentationUrl = request.DocumentationUrl;
        plugin.IsFeatured = request.IsFeatured;
        plugin.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var dto = new PluginDto
        {
            Id = plugin.Id,
            Name = plugin.Name,
            Slug = plugin.Slug,
            Description = plugin.Description,
            IconUrl = plugin.IconUrl,
            Category = plugin.Category,
            MonthlyPrice = plugin.MonthlyPrice,
            IsActive = plugin.IsActive,
            IsFeatured = plugin.IsFeatured,
            MinimumPlan = plugin.MinimumPlan.ToString(),
            DeveloperName = plugin.DeveloperName,
            DocumentationUrl = plugin.DocumentationUrl,
            CreatedAt = plugin.CreatedAt,
        };

        return new CreatePluginResult(true, "Plugin başarıyla güncellendi.", dto);
    }
}

// ── Toggle Plugin Active/Inactive (Admin) ────────────────────────────────────

public record TogglePluginCommand(Guid Id, bool IsActive) : IRequest<UnsubscribePluginResult>;

public class TogglePluginCommandHandler
    : IRequestHandler<TogglePluginCommand, UnsubscribePluginResult>
{
    private readonly AppDbContext _db;

    public TogglePluginCommandHandler(AppDbContext db) => _db = db;

    public async Task<UnsubscribePluginResult> Handle(
        TogglePluginCommand request,
        CancellationToken cancellationToken
    )
    {
        var plugin = await _db.Plugins.FirstOrDefaultAsync(
            p => p.Id == request.Id,
            cancellationToken
        );

        if (plugin == null)
            return new UnsubscribePluginResult(false, "Plugin bulunamadı.");

        plugin.IsActive = request.IsActive;
        plugin.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var status = request.IsActive ? "aktive edildi" : "deaktive edildi";
        return new UnsubscribePluginResult(true, $"Plugin başarıyla {status}.");
    }
}

// ── Delete Plugin (Admin) ────────────────────────────────────────────────────

public record DeletePluginCommand(Guid Id) : IRequest<UnsubscribePluginResult>;

public class DeletePluginCommandHandler
    : IRequestHandler<DeletePluginCommand, UnsubscribePluginResult>
{
    private readonly AppDbContext _db;

    public DeletePluginCommandHandler(AppDbContext db) => _db = db;

    public async Task<UnsubscribePluginResult> Handle(
        DeletePluginCommand request,
        CancellationToken cancellationToken
    )
    {
        var plugin = await _db.Plugins.FirstOrDefaultAsync(
            p => p.Id == request.Id,
            cancellationToken
        );

        if (plugin == null)
            return new UnsubscribePluginResult(false, "Plugin bulunamadı.");

        // Check if any merchant is actively subscribed
        var hasActiveSubscribers = await _db.MerchantPlugins.AnyAsync(
            mp => mp.PluginId == request.Id && mp.IsActive,
            cancellationToken
        );

        if (hasActiveSubscribers)
            return new UnsubscribePluginResult(
                false,
                "Bu plugin'e aktif aboneler var. Önce plugin'i deaktive edin."
            );

        _db.Plugins.Remove(plugin);
        await _db.SaveChangesAsync(cancellationToken);

        return new UnsubscribePluginResult(true, "Plugin başarıyla silindi.");
    }
}
