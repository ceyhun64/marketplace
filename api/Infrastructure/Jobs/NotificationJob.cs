using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

public class NotificationJob
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationJob> _logger;

    public NotificationJob(
        AppDbContext context,
        INotificationService notificationService,
        ILogger<NotificationJob> logger
    )
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        // Örnek: Henüz gönderilmemiş bildirimleri (is_sent = false) topla ve gönder
        // Şimdilik sadece çalışma mantığını simüle ediyoruz
        _logger.LogInformation("Bildirim kuyruğu işleniyor...");

        await Task.CompletedTask;
    }
}
