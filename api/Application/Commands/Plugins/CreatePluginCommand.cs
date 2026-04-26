using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;

namespace api.Application.Commands.Plugins;

public record CreatePluginCommand(
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

public record CreatePluginResult(bool Success, string Message, PluginDto? Data = null);

public class CreatePluginCommandHandler : IRequestHandler<CreatePluginCommand, CreatePluginResult>
{
    private readonly AppDbContext _db;

    public CreatePluginCommandHandler(AppDbContext db) => _db = db;

    public async Task<CreatePluginResult> Handle(
        CreatePluginCommand request,
        CancellationToken cancellationToken
    )
    {
        // Slug unique check
        if (_db.Plugins.Any(p => p.Slug == request.Slug))
            return new CreatePluginResult(false, "Bu slug zaten kullanımda.");

        var plugin = new Plugin
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            IconUrl = request.IconUrl,
            Category = request.Category,
            MonthlyPrice = request.MonthlyPrice,
            MinimumPlan = request.MinimumPlan,
            DeveloperName = request.DeveloperName,
            DocumentationUrl = request.DocumentationUrl,
            IsFeatured = request.IsFeatured,
            IsActive = true,
        };

        _db.Plugins.Add(plugin);
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

        return new CreatePluginResult(true, "Plugin başarıyla oluşturuldu.", dto);
    }
}
