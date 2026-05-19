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

    public EscrowSettlementJob(
        AppDbContext db,
        IWalletService wallet,
        IConfiguration config,
        ILogger<EscrowSettlementJob> logger)
    {
        _db = db;
        _wallet = wallet;
        _config = config;
        _logger = logger;
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
            }
        }

        _logger.LogInformation("EscrowSettlementJob complete. Settled {Count} vendor orders.", eligible.Count);
    }
}
