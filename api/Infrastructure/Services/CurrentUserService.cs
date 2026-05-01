using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace api.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    public string Role =>
        _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    public Guid? MerchantId
    {
        get
        {
            // Token claim is stored as "merchantId" (lowercase) — try both casings
            var value = _httpContextAccessor.HttpContext?.User.FindFirstValue("merchantId")
                     ?? _httpContextAccessor.HttpContext?.User.FindFirstValue("MerchantId");
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }
}
