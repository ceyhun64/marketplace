using api.Common.DTOs;
using api.Common.Extensions;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IPaymentService _paymentService;

    private static readonly Dictionary<PlanType, (string Name, decimal Price, List<string> Features, int? ProductLimit, bool MarketplaceAccess, bool PluginAccess)>
        PlanDefinitions = new()
        {
            [PlanType.Basic] = (
                "Basic",
                0m,
                new() { "E-mağaza açma", "20 ürün limiti", "Temel analitikler" },
                20, false, false
            ),
            [PlanType.Pro] = (
                "Pro",
                299m,
                new() { "Marketplace erişimi", "500 ürün limiti", "Gelişmiş analitikler", "Plugin desteği", "Özel domain" },
                500, true, true
            ),
            [PlanType.Enterprise] = (
                "Enterprise",
                799m,
                new() { "Sınırsız ürün", "Tüm özellikler", "Öncelikli destek", "Özel entegrasyonlar", "SLA garantisi" },
                null, true, true
            ),
        };

    public SubscriptionService(
        AppDbContext db,
        ICurrentUserService currentUser,
        IPaymentService paymentService)
    {
        _db = db;
        _currentUser = currentUser;
        _paymentService = paymentService;
    }

    // ── Plan listesi (herkese açık) ───────────────────────────────────────
    public Task<IEnumerable<SubscriptionPlanDto>> GetPlansAsync()
    {
        var plans = PlanDefinitions
            .Select(kvp => new SubscriptionPlanDto
            {
                PlanType          = kvp.Key.ToApiString(),
                Name              = kvp.Value.Name,
                MonthlyPrice      = kvp.Value.Price,
                Features          = kvp.Value.Features,
                ProductLimit      = kvp.Value.ProductLimit,
                MarketplaceAccess = kvp.Value.MarketplaceAccess,
                PluginAccess      = kvp.Value.PluginAccess,
            })
            .AsEnumerable();

        return Task.FromResult(plans);
    }

    // ── Abonelik satın al / yükselt ───────────────────────────────────────
    public async Task<ServiceResult<SubscriptionDto>> SubscribeAsync(SubscribeRequestDto dto)
    {
        if (!Enum.TryParse<PlanType>(dto.PlanType, true, out var planType))
            return ServiceResult<SubscriptionDto>.Fail("Geçersiz plan tipi.");

        var merchant = await _db.MerchantProfiles
            .Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return ServiceResult<SubscriptionDto>.Fail("Merchant profili bulunamadı.");

        var plan = PlanDefinitions[planType];

        // Ücretli plan için ödeme al
        if (plan.Price > 0)
        {
            if (string.IsNullOrEmpty(dto.PaymentToken))
                return ServiceResult<SubscriptionDto>.Fail("Ödeme token'ı gereklidir.");

            var paymentResult = await _paymentService.ProcessSubscriptionPaymentAsync(
                dto.PaymentToken, plan.Price, $"{plan.Name} Plan Aboneliği");

            if (!paymentResult.Success)
                return ServiceResult<SubscriptionDto>.Fail($"Ödeme başarısız: {paymentResult.Message}");
        }

        // Mevcut aboneliği güncelle veya yeni oluştur
        if (merchant.Subscription != null)
        {
            merchant.Subscription.Plan        = planType;
            merchant.Subscription.MonthlyPrice = plan.Price;
            merchant.Subscription.IsActive    = true;
            merchant.Subscription.StartDate   = DateTime.UtcNow;
            merchant.Subscription.ExpiresAt   = DateTime.UtcNow.AddMonths(1);
            merchant.Subscription.UpdatedAt   = DateTime.UtcNow;
        }
        else
        {
            var subscription = new Subscription
            {
                Id           = Guid.NewGuid(),
                MerchantId   = merchant.Id,
                Plan         = planType,
                MonthlyPrice = plan.Price,
                IsActive     = true,
                StartDate    = DateTime.UtcNow,
                ExpiresAt    = DateTime.UtcNow.AddMonths(1),
                AutoRenew    = true,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow,
            };
            _db.Subscriptions.Add(subscription);
            merchant.Subscription = subscription;
        }

        await _db.SaveChangesAsync();

        return ServiceResult<SubscriptionDto>.Ok(ToDto(merchant.Subscription!));
    }

    // ── Mevcut aboneliği getir ────────────────────────────────────────────
    public async Task<SubscriptionDto?> GetCurrentSubscriptionAsync()
    {
        var subscription = await _db.Subscriptions
            .Include(s => s.Merchant)
            .FirstOrDefaultAsync(s => s.Merchant.UserId == _currentUser.UserId && s.IsActive);

        return subscription == null ? null : ToDto(subscription);
    }

    // ── Abonelik iptal ────────────────────────────────────────────────────
    public async Task<ServiceResult<bool>> CancelSubscriptionAsync()
    {
        var subscription = await _db.Subscriptions
            .Include(s => s.Merchant)
            .FirstOrDefaultAsync(s => s.Merchant.UserId == _currentUser.UserId && s.IsActive);

        if (subscription == null)
            return ServiceResult<bool>.Fail("Aktif abonelik bulunamadı.");

        subscription.IsActive   = false;
        subscription.AutoRenew  = false;
        subscription.UpdatedAt  = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    // ── Plugin listesi ────────────────────────────────────────────────────
    public async Task<IEnumerable<PluginDto>> GetPluginsAsync()
    {
        return await _db.Plugins
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.IsFeatured)
            .ThenBy(p => p.Name)
            .Select(p => new PluginDto
            {
                Id             = p.Id,
                Name           = p.Name,
                Slug           = p.Slug,
                Description    = p.Description,
                IconUrl        = p.IconUrl,
                Category       = p.Category,
                MonthlyPrice   = p.MonthlyPrice,
                IsActive       = p.IsActive,
                IsFeatured     = p.IsFeatured,
                MinimumPlan    = p.MinimumPlan.ToString(),
                DeveloperName  = p.DeveloperName,
                DocumentationUrl = p.DocumentationUrl,
            })
            .ToListAsync();
    }

    // ── Plugin aboneliği satın al ─────────────────────────────────────────
    public async Task<ServiceResult<bool>> SubscribePluginAsync(Guid pluginId)
    {
        var merchant = await _db.MerchantProfiles
            .Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return ServiceResult<bool>.Fail("Merchant profili bulunamadı.");

        var plugin = await _db.Plugins.FindAsync(pluginId);
        if (plugin == null || !plugin.IsActive)
            return ServiceResult<bool>.Fail("Plugin bulunamadı.");

        // Plan seviyesi yeterli mi?
        var currentPlan = merchant.Subscription?.Plan ?? PlanType.Basic;
        if (currentPlan < plugin.MinimumPlan)
            return ServiceResult<bool>.Fail(
                $"Bu plugin için en az {plugin.MinimumPlan} planı gereklidir.");

        // Zaten aktif abonelik var mı?
        var existing = await _db.MerchantPlugins
            .FirstOrDefaultAsync(mp => mp.MerchantId == merchant.Id && mp.PluginId == pluginId && mp.IsActive);

        if (existing != null)
            return ServiceResult<bool>.Fail("Bu plugin'e zaten abonesiniz.");

        _db.MerchantPlugins.Add(new MerchantPlugin
        {
            Id           = Guid.NewGuid(),
            MerchantId   = merchant.Id,
            PluginId     = pluginId,
            IsActive     = true,
            SubscribedAt = DateTime.UtcNow,
            ExpiresAt    = DateTime.UtcNow.AddMonths(1),
            AutoRenew    = true,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────
    private static SubscriptionDto ToDto(Subscription s) => new()
    {
        Id           = s.Id,
        PlanType     = s.Plan.ToApiString(),
        IsActive     = s.IsActive,
        StartDate    = s.StartDate,
        ExpiresAt    = s.ExpiresAt,
        MonthlyPrice = s.MonthlyPrice,
    };
}