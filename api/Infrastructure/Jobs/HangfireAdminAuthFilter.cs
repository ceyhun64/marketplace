using Hangfire.Dashboard;

namespace api.Infrastructure.Jobs;

public class HangfireAdminAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Geliştirme ortamında kolaylık olması için true dönebiliriz
        // ancak canlı ortamda aşağıdaki gibi rol kontrolü yapılmalı:
        return httpContext.User.Identity?.IsAuthenticated == true
            && httpContext.User.IsInRole("Admin");
    }
}
