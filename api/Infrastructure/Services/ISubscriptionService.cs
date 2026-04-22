using api.Common.DTOs;

namespace api.Infrastructure.Services;

public interface ISubscriptionService
{
    Task<IEnumerable<SubscriptionPlanDto>> GetPlansAsync();
    Task<ServiceResult<SubscriptionDto>> SubscribeAsync(SubscribeRequestDto dto);
    Task<SubscriptionDto?> GetCurrentSubscriptionAsync();
    Task<ServiceResult<bool>> CancelSubscriptionAsync();
    Task<IEnumerable<PluginDto>> GetPluginsAsync();
    Task<ServiceResult<bool>> SubscribePluginAsync(Guid pluginId);
}
