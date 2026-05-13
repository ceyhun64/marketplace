using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/subscriptions")]
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ISubscriptionService _subscriptionService;
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public SubscriptionsController(
        IMediator mediator,
        ISubscriptionService subscriptionService,
        AppDbContext db,
        ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _subscriptionService = subscriptionService;
        _db = db;
        _currentUser = currentUser;
    }

    // GET /api/subscriptions/plans — Public
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _subscriptionService.GetPlansAsync();
        return Ok(new ApiResponse<IEnumerable<SubscriptionPlanDto>>(plans));
    }

    // POST /api/subscriptions/subscribe — Merchant
    [HttpPost("subscribe")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequestDto request)
    {
        var result = await _subscriptionService.SubscribeAsync(request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<SubscriptionDto>(result.Data!));
    }

    // POST /api/subscriptions/upgrade — Merchant (alias for subscribe)
    [HttpPost("upgrade")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> Upgrade([FromBody] UpgradeRequestDto request)
    {
        var subscribeRequest = new SubscribeRequestDto { PlanType = request.Plan };
        var result = await _subscriptionService.SubscribeAsync(subscribeRequest);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<SubscriptionDto>(result.Data!));
    }

    // GET /api/subscriptions/current — Merchant
    [HttpGet("current")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetCurrentSubscription()
    {
        var subscription = await _subscriptionService.GetCurrentSubscriptionAsync();
        if (subscription == null)
            return NotFound(new ApiResponse<string>("Aktif abonelik bulunamadı."));
        return Ok(new ApiResponse<SubscriptionDto>(subscription));
    }

    // GET /api/subscriptions/my — Merchant (alias for current)
    [HttpGet("my")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMySubscription()
    {
        var subscription = await _subscriptionService.GetCurrentSubscriptionAsync();
        if (subscription == null)
            return NotFound(new ApiResponse<string>("Aktif abonelik bulunamadı."));
        return Ok(new ApiResponse<SubscriptionDto>(subscription));
    }

    // POST /api/subscriptions/cancel — Merchant
    [HttpPost("cancel")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> CancelSubscription()
    {
        var result = await _subscriptionService.CancelSubscriptionAsync();
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<string>("Abonelik iptal edildi."));
    }

    // GET /api/subscriptions/plugins — Merchant
    [HttpGet("plugins")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetPlugins()
    {
        var plugins = await _subscriptionService.GetPluginsAsync();
        return Ok(new ApiResponse<IEnumerable<PluginDto>>(plugins));
    }

    // POST /api/subscriptions/plugins/{id}/subscribe — Merchant
    [HttpPost("plugins/{id}/subscribe")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> SubscribePlugin(Guid id)
    {
        var result = await _subscriptionService.SubscribePluginAsync(id);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<string>("Plugin aboneliği başarıyla oluşturuldu."));
    }

    // GET /api/subscriptions/admin/all — Admin
    [HttpGet("admin/all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAllSubscriptions(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        var query = _db.Subscriptions
            .Include(s => s.Merchant)
            .AsQueryable();

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(s => new
            {
                s.Id,
                s.MerchantId,
                MerchantName = s.Merchant.StoreName,
                Plan = s.Plan.ToString(),
                s.IsActive,
                s.StartDate,
                s.ExpiresAt,
                Price = s.MonthlyPrice,
                s.CreatedAt,
            })
            .ToListAsync();

        return Ok(new ApiResponse<object>(new { total, page, limit, items }));
    }
}

public record UpgradeRequestDto(string Plan);
