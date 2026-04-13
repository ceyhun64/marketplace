using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

public class OrderStatusJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderStatusJob> _logger;

    public OrderStatusJob(AppDbContext context, ILogger<OrderStatusJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation("Sipariş durum kontrolü başlatıldı: {Time}", DateTime.UtcNow);

        // Örnek: 24 saattir "Hazırlanıyor" aşamasında kalan siparişleri bul ve logla/uyar
        var staleOrders = await _context
            .Orders.Where(o =>
                o.Status == OrderStatus.Pending && o.CreatedAt < DateTime.UtcNow.AddDays(-1)
            )
            .ToListAsync();

        foreach (var order in staleOrders)
        {
            _logger.LogWarning("Sipariş gecikmiş görünüyor: {OrderId}", order.Id);
            // Burada satıcıya otomatik uyarı maili tetiklenebilir
        }
    }
}
