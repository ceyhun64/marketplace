using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job (runs daily at 02:00 UTC).
/// Finds VendorOrders that have been DELIVERED beyond the configurable
/// holding period and clears their funds into the merchant's AvailableBalance.
/// </summary>
public class EscrowSettlementJob
{
    private readonly AppDbContext _db;
    private readonly IWalletService _wallet;
    private readonly IConfiguration _config;
    private readonly ILogger<EscrowSettlementJob> _logger;
    private readonly INotificationService _notifications;

    public EscrowSettlementJob(
        AppDbContext db,
        IWalletService wallet,
        IConfiguration config,
        ILogger<EscrowSettlementJob> logger,
        INotificationService notifications)
    {
        _db = db;
        _wallet = wallet;
        _config = config;
        _logger = logger;
        _notifications = notifications;
    }

    public async Task RunAsync()
    {
        // Configurable holding period (default 3 days)
        var holdingHours = _config.GetValue<int>("Wallet:EscrowHoldingHours", 72);
        var cutoff = DateTime.UtcNow.AddHours(-holdingHours);

        var eligible = await _db.VendorOrders
            .Where(vo =>
                vo.Status == OrderStatus.Delivered &&
                vo.SettledAt == null &&
                vo.UpdatedAt <= cutoff)
            .ToListAsync();

        _logger.LogInformation("EscrowSettlementJob: {Count} vendor orders eligible for settlement.", eligible.Count);

        var failedIds = new List<string>();

        foreach (var vendorOrder in eligible)
        {
            try
            {
                await _wallet.SettleVendorOrderAsync(vendorOrder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Settlement failed for VendorOrderId={Id} MerchantId={MerchantId}",
                    vendorOrder.Id, vendorOrder.MerchantId);
                failedIds.Add($"{vendorOrder.Id} (Merchant: {vendorOrder.MerchantId})");
            }
        }

        var succeeded = eligible.Count - failedIds.Count;
        _logger.LogInformation("EscrowSettlementJob complete. Settled={Succeeded} Failed={Failed}.",
            succeeded, failedIds.Count);

        if (failedIds.Count > 0)
        {
            var adminEmail = _config["Admin:AlertEmail"];
            if (!string.IsNullOrEmpty(adminEmail))
            {
                var body = $"EscrowSettlementJob completed with {failedIds.Count} failure(s).\n\n" +
                           $"Failed VendorOrder IDs:\n{string.Join("\n", failedIds)}\n\n" +
                           $"Please investigate and manually settle these orders.";
                try
                {
                    await _notifications.SendEmailAsync(adminEmail, "⚠ Escrow Settlement Failures", body);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "EscrowSettlementJob: failed to send admin alert email.");
                }
            }
        }
    }
}
