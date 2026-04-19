using api.Common.DTOs;
using api.Infrastructure.Services;

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/subscriptions")]
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(IMediator mediator, ISubscriptionService subscriptionService)
    {
        _mediator = mediator;
        _subscriptionService = subscriptionService;
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
        return Ok(new ApiResponse<SubscriptionDto>(result.Data));
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
}
