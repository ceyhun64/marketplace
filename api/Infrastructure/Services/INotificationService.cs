namespace api.Infrastructure.Services;

public interface INotificationService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendOrderUpdateNotificationAsync(string userId, string message);
}
