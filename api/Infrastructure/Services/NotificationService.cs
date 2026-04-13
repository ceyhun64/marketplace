namespace api.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string body)
    {
        _logger.LogInformation("Email gönderiliyor: {To}", to);
        return Task.CompletedTask;
    }

    public Task SendOrderUpdateNotificationAsync(string userId, string message)
    {
        _logger.LogInformation("Bildirim gönderiliyor: {User}", userId);
        return Task.CompletedTask;
    }
}
