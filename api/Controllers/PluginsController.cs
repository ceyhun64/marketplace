using api.Application.Commands.Plugins;
using api.Application.Queries.Plugins;
using api.Common.DTOs;
using api.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/plugins")]
public class PluginsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PluginsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ── Public / Merchant: List all plugins ──────────────────────────────────

    /// <summary>
    /// GET /api/plugins
    /// Tüm aktif plugin'leri listeler. Merchant girişi varsa IsSubscribed flag'i doldurulur.
    /// Admin için ?isActive=false ile pasif plugin'ler de görüntülenebilir.
    /// Frontend: AdminPluginsPage (/plugins?search=...) ve usePlugins hook (/api/plugins)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlugins(
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool? isFeatured = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var result = await _mediator.Send(
            new GetPluginsQuery(category, isActive, isFeatured, page, limit)
        );
        return Ok(new ApiResponse<GetPluginsResult>(result));
    }

    /// <summary>
    /// GET /api/plugins/available
    /// Merchant için abone olunabilir plugin'lerin listesi (aktif olanlar).
    /// Frontend: MerchantPluginsView (/plugins/available)
    /// </summary>
    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailablePlugins(
        [FromQuery] string? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50
    )
    {
        var result = await _mediator.Send(
            new GetPluginsQuery(category, IsActive: true, IsFeatured: null, page, limit)
        );
        return Ok(new ApiResponse<List<PluginDto>>(result.Items));
    }

    // ── Merchant: My plugins ─────────────────────────────────────────────────

    /// <summary>
    /// GET /api/plugins/my
    /// Merchant'ın aktif plugin aboneliklerini getirir.
    /// Frontend: useMyPlugins hook
    /// </summary>
    [HttpGet("my")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMyPlugins()
    {
        var result = await _mediator.Send(new GetMerchantPluginsQuery());
        return Ok(new ApiResponse<List<MerchantPluginDto>>(result));
    }

    /// <summary>
    /// POST /api/plugins/{id}/activate
    /// Merchant bir plugin'e abone olur / yeniden aktive eder.
    /// Frontend: useActivatePlugin mutation
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> ActivatePlugin(Guid id)
    {
        var result = await _mediator.Send(new SubscribePluginCommand(id));
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<MerchantPluginDto?>(result.Data) { Message = result.Message });
    }

    /// <summary>
    /// POST /api/plugins/{id}/subscribe
    /// Merchant bir plugin'e abone olur (MerchantPluginsView kullanımı).
    /// Frontend: MerchantPluginsView subscribeMutation
    /// </summary>
    [HttpPost("{id:guid}/subscribe")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> SubscribePlugin(Guid id)
    {
        var result = await _mediator.Send(new SubscribePluginCommand(id));
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<MerchantPluginDto?>(result.Data) { Message = result.Message });
    }

    /// <summary>
    /// DELETE /api/plugins/{id}/deactivate
    /// Merchant plugin aboneliğini iptal eder.
    /// Frontend: useDeactivatePlugin mutation
    /// </summary>
    [HttpDelete("{id:guid}/deactivate")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> DeactivatePlugin(Guid id)
    {
        var result = await _mediator.Send(new UnsubscribePluginCommand(id));
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<string>(result.Message));
    }

    /// <summary>
    /// DELETE /api/plugins/{id}/subscribe
    /// Plugin aboneliğini iptal eder (MerchantPluginsView unsubscribeMutation).
    /// Frontend: MerchantPluginsView unsubscribeMutation
    /// </summary>
    [HttpDelete("{id:guid}/subscribe")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> UnsubscribePlugin(Guid id)
    {
        var result = await _mediator.Send(new UnsubscribePluginCommand(id));
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<string>(result.Message));
    }

    /// <summary>
    /// PUT /api/plugins/{id}/config
    /// Merchant plugin yapılandırmasını (API key, webhook URL vs.) günceller.
    /// </summary>
    [HttpPut("{id:guid}/config")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> UpdatePluginConfig(
        Guid id,
        [FromBody] UpdatePluginConfigDto dto
    )
    {
        var result = await _mediator.Send(
            new UpdatePluginConfigCommand(id, dto.Config, dto.AutoRenew)
        );
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<string>(result.Message));
    }

    // ── Admin: Plugin CRUD ───────────────────────────────────────────────────

    /// <summary>
    /// POST /api/plugins
    /// Admin yeni plugin oluşturur.
    /// Frontend: AdminPluginsPage createMutation
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> CreatePlugin([FromBody] CreatePluginDto dto)
    {
        if (!Enum.TryParse<PlanType>(dto.MinimumPlan, ignoreCase: true, out var planType))
            planType = PlanType.Pro;

        var result = await _mediator.Send(
            new CreatePluginCommand(
                dto.Name,
                dto.Slug,
                dto.Description,
                dto.IconUrl,
                dto.Category,
                dto.MonthlyPrice,
                planType,
                dto.DeveloperName,
                dto.DocumentationUrl,
                dto.IsFeatured
            )
        );

        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return CreatedAtAction(
            nameof(GetPlugins),
            null,
            new ApiResponse<PluginDto?>(result.Data) { Message = result.Message }
        );
    }

    /// <summary>
    /// PUT /api/plugins/{id}
    /// Admin plugin bilgilerini günceller.
    /// Frontend: AdminPluginsPage updateMutation
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdatePlugin(Guid id, [FromBody] CreatePluginDto dto)
    {
        if (!Enum.TryParse<PlanType>(dto.MinimumPlan, ignoreCase: true, out var planType))
            planType = PlanType.Pro;

        var result = await _mediator.Send(
            new UpdateAdminPluginCommand(
                id,
                dto.Name,
                dto.Slug,
                dto.Description,
                dto.IconUrl,
                dto.Category,
                dto.MonthlyPrice,
                planType,
                dto.DeveloperName,
                dto.DocumentationUrl,
                dto.IsFeatured
            )
        );

        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<PluginDto?>(result.Data) { Message = result.Message });
    }

    /// <summary>
    /// PATCH /api/plugins/{id}/toggle
    /// Admin plugin aktif/pasif toggle.
    /// Frontend: AdminPluginsPage toggleMutation
    /// </summary>
    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> TogglePlugin(Guid id, [FromBody] TogglePluginDto dto)
    {
        var result = await _mediator.Send(new TogglePluginCommand(id, dto.IsActive));
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<string>(result.Message));
    }

    /// <summary>
    /// DELETE /api/plugins/{id}
    /// Admin plugin siler.
    /// Frontend: AdminPluginsPage deleteMutation
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeletePlugin(Guid id)
    {
        var result = await _mediator.Send(new DeletePluginCommand(id));
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));

        return Ok(new ApiResponse<string>(result.Message));
    }
}
