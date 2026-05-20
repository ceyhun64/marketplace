using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notification;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        AppDbContext db,
        ICurrentUserService currentUser,
        INotificationService notification,
        IConfiguration config,
        ILogger<AdminController> logger
    )
    {
        _db = db;
        _currentUser = currentUser;
        _notification = notification;
        _config = config;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfDay = now.Date.ToUniversalTime();

        var totalOrders = await _db.Orders.CountAsync();
        var ordersToday = await _db.Orders.CountAsync(o => o.CreatedAt >= startOfDay);
        var ordersThisMonth = await _db.Orders.CountAsync(o => o.CreatedAt >= startOfMonth);
        var revenueThisMonth =
            await _db
                .Orders.Where(o => o.CreatedAt >= startOfMonth && o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount)
            ?? 0;
        var totalMerchants = await _db.MerchantProfiles.CountAsync();
        var activeMerchants = await _db.MerchantProfiles.CountAsync(m => m.IsActive);
        var totalUsers = await _db.Users.CountAsync();
        var pendingProducts = await _db.Products.CountAsync(p => !p.IsApproved && !p.IsDeleted);
        var pendingMerchants = await _db.Users.CountAsync(u =>
            u.Role == UserRole.Merchant
            && u.AccountStatus == AccountStatus.PendingApproval
            && !u.IsDeleted
        );
        var activeShipments = await _db.Shipments.CountAsync(s =>
            s.Status != ShipmentStatus.Delivered && s.Status != ShipmentStatus.Failed
        );

        var totalProducts = await _db.Products.CountAsync(p => !p.IsDeleted);
        var pendingOrders = await _db.Orders.CountAsync(o =>
            o.Status == OrderStatus.Pending || o.Status == OrderStatus.PaymentConfirmed
        );
        var totalShipments = await _db.Shipments.CountAsync();
        var deliveredShipments = await _db.Shipments.CountAsync(s =>
            s.Status == ShipmentStatus.Delivered
        );
        var fulfillmentSuccessRate =
            totalShipments == 0
                ? 0.0
                : Math.Round((double)deliveredShipments / totalShipments * 100, 2);

        return Ok(
            new
            {
                orders = new
                {
                    totalOrders,
                    pendingOrders,
                    ordersToday,
                    ordersThisMonth,
                },
                revenue = new { revenueThisMonth, totalRevenue = revenueThisMonth },
                merchants = new { totalMerchants, activeMerchants },
                totalUsers,
                totalProducts,
                pendingProducts,
                pendingMerchants,
                activeShipments,
                fulfillmentSuccessRate,
                // Flat aliases for backward compatibility
                totalOrders,
                totalMerchants,
                activeMerchants,
                totalRevenue = revenueThisMonth,
            }
        );
    }

    // ── MERCHANT APPLICATIONS (Option B) ────────────────────────────────────

    /// <summary>Lists pending merchant applications.</summary>
    [HttpGet("merchants/pending")]
    public async Task<IActionResult> GetPendingMerchants()
    {
        var pending = await _db
            .Users.Include(u => u.MerchantProfile)
            .Where(u =>
                u.Role == UserRole.Merchant
                && u.AccountStatus == AccountStatus.PendingApproval
                && !u.IsDeleted
            )
            .OrderBy(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Phone,
                u.CreatedAt,
                Store = u.MerchantProfile == null
                    ? null
                    : new
                    {
                        u.MerchantProfile.Id,
                        u.MerchantProfile.StoreName,
                        u.MerchantProfile.Slug,
                        u.MerchantProfile.Description,
                    },
            })
            .ToListAsync();

        return Ok(pending);
    }

    /// <summary>Approves a merchant application — account becomes active, can obtain JWT.</summary>
    [HttpPost("merchants/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveMerchant(Guid userId)
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user is null)
            return NotFound(new { message = "User not found." });

        if (user.Role != UserRole.Merchant)
            return BadRequest(new { message = "This user is not a merchant." });

        if (user.AccountStatus != AccountStatus.PendingApproval)
            return BadRequest(
                new { message = $"Application has already been processed: {user.AccountStatus}" }
            );

        user.AccountStatus = AccountStatus.Active;
        user.IsVerified = true;

        if (user.MerchantProfile is not null)
        {
            user.MerchantProfile.IsActive = true;
            user.MerchantProfile.UpdatedAt = DateTime.UtcNow;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Merchant approved: {Email}", user.Email);

        // Send approval email to applicant
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
        _ = Task.Run(async () =>
        {
            try
            {
                await _notification.SendEmailAsync(
                    user.Email,
                    "Your merchant application has been approved!",
                    $"""
                    Hi {user.FirstName},

                    Your merchant application has been approved. You can now sign in to your account:
                    {frontendUrl}/auth/login

                    Happy selling!
                    """
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send approval email: {Email}", user.Email);
            }
        });

        return Ok(new { message = "Merchant application approved.", userId });
    }

    /// <summary>Rejects a merchant application.</summary>
    [HttpPost("merchants/{userId:guid}/reject")]
    public async Task<IActionResult> RejectMerchant(Guid userId, [FromBody] RejectMerchantDto dto)
    {
        var user = await _db
            .Users.Include(u => u.MerchantProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user is null)
            return NotFound(new { message = "User not found." });

        if (user.AccountStatus != AccountStatus.PendingApproval)
            return BadRequest(
                new { message = $"Application has already been processed: {user.AccountStatus}" }
            );

        user.AccountStatus = AccountStatus.Rejected;
        user.RejectionReason = dto.Reason;
        user.UpdatedAt = DateTime.UtcNow;

        if (user.MerchantProfile is not null)
        {
            user.MerchantProfile.IsActive = false;
            user.MerchantProfile.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Merchant application rejected: {Email} — {Reason}",
            user.Email,
            dto.Reason
        );

        // Send rejection email to applicant
        _ = Task.Run(async () =>
        {
            try
            {
                await _notification.SendEmailAsync(
                    user.Email,
                    "Regarding your merchant application",
                    $"""
                    Hi {user.FirstName},

                    Unfortunately, your merchant application could not be approved at this time.

                    Reason: {dto.Reason}

                    Please contact us if you have any questions.
                    """
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send rejection email: {Email}", user.Email);
            }
        });

        return Ok(new { message = "Application rejected.", userId });
    }

    // ── MERCHANTS ────────────────────────────────────────────────────────────

    [HttpGet("merchants")]
    public async Task<IActionResult> GetMerchants(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null
    )
    {
        var query = _db
            .MerchantProfiles.Include(m => m.User)
            .Include(m => m.Subscription)
            .Where(m => m.User.AccountStatus == AccountStatus.Active)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(m =>
                EF.Functions.ILike(m.StoreName, $"%{search}%")
                || EF.Functions.ILike(m.User.Email, $"%{search}%")
            );

        if (isActive.HasValue)
            query = query.Where(m => m.IsActive == isActive.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Slug,
                m.IsActive,
                m.CustomDomain,
                m.DomainVerified,
                m.CreatedAt,
                Email = m.User.Email,
                Plan = m.Subscription == null ? "none" : m.Subscription.Plan.ToString(),
                ProductCount = m.Products.Count(p => !p.IsDeleted),
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                page,
                limit,
                items,
            }
        );
    }

    [HttpPost("merchants")]
    public async Task<IActionResult> CreateMerchant(
        [FromBody] CreateMerchantDto dto,
        [FromServices] ITokenService tokenService
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            return BadRequest(new { message = "This email is already registered." });

        if (await _db.MerchantProfiles.AnyAsync(m => m.Slug == dto.Slug))
            return BadRequest(new { message = "This slug is already in use." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Merchant,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow,
        };

        var merchant = new MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StoreName = dto.StoreName,
            Slug = dto.Slug,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            HandlingHours = dto.HandlingHours ?? 24,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            null,
            null,
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.Slug,
            }
        );
    }

    [HttpPut("merchants/{id:guid}")]
    public async Task<IActionResult> UpdateMerchant(Guid id, [FromBody] UpdateMerchantDto dto)
    {
        var merchant = await _db
            .MerchantProfiles.Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (merchant == null)
            return NotFound();

        merchant.StoreName = dto.StoreName ?? merchant.StoreName;
        merchant.Latitude = dto.Latitude ?? merchant.Latitude;
        merchant.Longitude = dto.Longitude ?? merchant.Longitude;
        merchant.HandlingHours = dto.HandlingHours ?? merchant.HandlingHours;
        merchant.UpdatedAt = DateTime.UtcNow;

        // Plan change — update or create Subscription record
        if (
            !string.IsNullOrEmpty(dto.Plan)
            && Enum.TryParse<PlanType>(dto.Plan, ignoreCase: true, out var newPlan)
        )
        {
            if (merchant.Subscription is not null)
            {
                merchant.Subscription.Plan = newPlan;
                merchant.Subscription.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var sub = new Subscription
                {
                    Id = Guid.NewGuid(),
                    MerchantId = merchant.Id,
                    Plan = newPlan,
                    IsActive = true,
                    StartDate = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddYears(10),
                    AutoRenew = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _db.Subscriptions.Add(sub);
            }
        }

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.IsActive,
                Plan = merchant.Subscription?.Plan.ToString() ?? "Basic",
            }
        );
    }

    [HttpPatch("merchants/{id:guid}/suspend")]
    public async Task<IActionResult> ToggleSuspend(Guid id)
    {
        var merchant = await _db.MerchantProfiles.FindAsync(id);
        if (merchant == null)
            return NotFound();

        merchant.IsActive = !merchant.IsActive;
        merchant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(
            new
            {
                merchant.Id,
                merchant.IsActive,
                message = $"Merchant {(merchant.IsActive ? "activated" : "suspended")}.",
            }
        );
    }

    // ── ORDERS ───────────────────────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? merchantId = null
    )
    {
        var query = _db.Orders.Include(o => o.Customer).Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var ps))
            query = query.Where(o => o.Status == ps);

        if (merchantId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.MerchantId == merchantId.Value));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                o.Id,
                o.Status,
                o.TotalAmount,
                o.Source,
                o.CreatedAt,
                Customer = new { o.Customer.Id, o.Customer.Email },
                ItemCount = o.Items.Count,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                page,
                limit,
                items,
            }
        );
    }

    [HttpPatch("orders/{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null)
            return NotFound();

        if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
            return BadRequest(new { message = "Invalid order status." });

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status });
    }

    // ── PRODUCTS ─────────────────────────────────────────────────────────────

    [HttpGet("products/pending")]
    public async Task<IActionResult> GetPendingProducts()
    {
        var pending = await _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .Where(p => !p.IsApproved && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                id = p.Id,
                name = p.Name,
                description = p.Description,
                images = p.Images,
                tags = p.Tags,
                price = p.Price,
                createdAt = p.CreatedAt,
                categoryName = p.Category == null
                    ? ""
                    : (p.Category.ParentId == null ? p.Category.Name : p.Category.Parent!.Name),
                subcategoryName = p.Category == null
                    ? (string?)null
                    : (p.Category.ParentId == null ? (string?)null : p.Category.Name),
                createdByName = p.Merchant.User == null
                    ? ""
                    : $"{p.Merchant.User.FirstName} {p.Merchant.User.LastName}".Trim(),
                merchantStoreName = p.Merchant.StoreName,
            })
            .ToListAsync();

        return Ok(new { data = pending, total = pending.Count });
    }

    [HttpPatch("products/{id:guid}/approve")]
    public async Task<IActionResult> ApproveProduct(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null || product.IsDeleted)
            return NotFound();

        product.IsApproved = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Product approved.", product.Id });
    }

    [HttpPatch("products/{id:guid}/reject")]
    public async Task<IActionResult> RejectProduct(Guid id, [FromBody] RejectProductAdminDto? dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null || product.IsDeleted)
            return NotFound();

        // Mark product as not approved (IsApproved=false, logging/notification only)
        product.IsApproved = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Product rejected.", product.Id });
    }

    // ── STORE SETUP ───────────────────────────────────────────────────────────

    [HttpPost("store/{merchantId:guid}/setup")]
    public async Task<IActionResult> SetupMerchantStore(
        Guid merchantId,
        [FromBody] AdminStoreSetupDto dto
    )
    {
        var merchant = await _db.MerchantProfiles.FindAsync(merchantId);
        if (merchant == null)
            return NotFound(new { message = "Merchant not found." });

        if (dto.StoreName is not null)
            merchant.StoreName = dto.StoreName;
        if (dto.Slug is not null)
            merchant.Slug = dto.Slug;
        if (dto.Description is not null)
            merchant.Description = dto.Description;
        if (dto.LogoUrl is not null)
            merchant.LogoUrl = dto.LogoUrl;
        if (dto.BannerUrl is not null)
            merchant.BannerUrl = dto.BannerUrl;
        if (dto.HandlingHours.HasValue)
            merchant.HandlingHours = dto.HandlingHours.Value;
        if (dto.Latitude.HasValue)
            merchant.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue)
            merchant.Longitude = dto.Longitude.Value;

        merchant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Store setup complete.", merchantId });
    }

    // ── ANALYTICS ────────────────────────────────────────────────────────────

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] string period = "month")
    {
        var from = period switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddDays(-30),
            "year" => DateTime.UtcNow.AddDays(-365),
            _ => DateTime.UtcNow.AddDays(-30),
        };

        var revenue =
            await _db
                .Orders.Where(o => o.CreatedAt >= from && o.Status != OrderStatus.Cancelled)
                .SumAsync(o => (decimal?)o.TotalAmount)
            ?? 0;
        var orderCount = await _db.Orders.CountAsync(o => o.CreatedAt >= from);
        var newUsers = await _db.Users.CountAsync(u => u.CreatedAt >= from);

        var dailyOrders = await _db
            .Orders.Where(o => o.CreatedAt >= from)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new
            {
                date = g.Key,
                count = g.Count(),
                revenue = g.Sum(o => o.TotalAmount),
            })
            .OrderBy(g => g.date)
            .ToListAsync();

        return Ok(
            new
            {
                period,
                revenue,
                orderCount,
                newUsers,
                dailyOrders,
            }
        );
    }

    // ── COMMISSION SETTINGS ──────────────────────────────────────────────────

    /// <summary>Returns platform commission and fee configuration.</summary>
    [HttpGet("settings/commission")]
    public IActionResult GetCommissionSettings()
    {
        return Ok(
            new
            {
                marketplaceFeePercent = _config.GetValue<decimal>(
                    "Commission:MarketplaceFeePercent",
                    8.0m
                ),
                paymentProcessingFeePercent = _config.GetValue<decimal>(
                    "Commission:PaymentProcessingFeePercent",
                    2.9m
                ),
                paymentProcessingFlatFee = _config.GetValue<decimal>(
                    "Commission:PaymentProcessingFlatFee",
                    0.30m
                ),
                subscriptionBasicMonthly = _config.GetValue<decimal>(
                    "Commission:SubscriptionBasicMonthly",
                    0m
                ),
                subscriptionProMonthly = _config.GetValue<decimal>(
                    "Commission:SubscriptionProMonthly",
                    299m
                ),
                subscriptionEnterpriseMonthly = _config.GetValue<decimal>(
                    "Commission:SubscriptionEnterpriseMonthly",
                    799m
                ),
                refundFeePercent = _config.GetValue<decimal>("Commission:RefundFeePercent", 0m),
                currencyCode = _config["Commission:CurrencyCode"] ?? "TRY",
                updatedAt = DateTime.UtcNow,
            }
        );
    }

    // ── AUDIT LOGS ────────────────────────────────────────────────────────────

    /// <summary>
    /// Audit log derived from recent platform activity.
    /// Derived from the existing DB without a separate log table.
    /// </summary>
    [HttpGet("logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? eventType = null
    )
    {
        var events = new List<AuditLogEntry>();

        // Order events
        if (eventType is null or "order")
        {
            var orders = await _db
                .Orders.OrderByDescending(o => o.UpdatedAt)
                .Take(200)
                .Select(o => new
                {
                    o.Id,
                    o.Status,
                    o.TotalAmount,
                    o.UpdatedAt,
                    o.CreatedAt,
                    o.CustomerId,
                })
                .ToListAsync();

            foreach (var o in orders)
            {
                events.Add(
                    new AuditLogEntry(
                        Id: Guid.NewGuid(),
                        EventType: "order",
                        Severity: "info",
                        Message: $"Order {o.Id.ToString()[..8].ToUpper()} → {o.Status} (${o.TotalAmount:F2})",
                        ActorId: o.CustomerId,
                        ResourceId: o.Id,
                        OccurredAt: o.UpdatedAt
                    )
                );
            }
        }

        // User registration events
        if (eventType is null or "user")
        {
            var users = await _db
                .Users.Where(u => !u.IsDeleted)
                .OrderByDescending(u => u.CreatedAt)
                .Take(100)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.Role,
                    u.AccountStatus,
                    u.CreatedAt,
                })
                .ToListAsync();

            foreach (var u in users)
            {
                events.Add(
                    new AuditLogEntry(
                        Id: Guid.NewGuid(),
                        EventType: "user",
                        Severity: u.AccountStatus == AccountStatus.Suspended ? "warning" : "info",
                        Message: $"User registered: {u.Email} [{u.Role}] — status: {u.AccountStatus}",
                        ActorId: u.Id,
                        ResourceId: u.Id,
                        OccurredAt: u.CreatedAt
                    )
                );
            }
        }

        // Merchant application / status events
        if (eventType is null or "merchant")
        {
            var merchants = await _db
                .MerchantProfiles.Include(m => m.User)
                .OrderByDescending(m => m.UpdatedAt)
                .Take(100)
                .Select(m => new
                {
                    m.Id,
                    m.StoreName,
                    m.IsActive,
                    m.UpdatedAt,
                    m.CreatedAt,
                    UserEmail = m.User.Email,
                    UserId = m.User.Id,
                    UserStatus = m.User.AccountStatus,
                })
                .ToListAsync();

            foreach (var m in merchants)
            {
                var severity =
                    !m.IsActive ? "warning"
                    : m.UserStatus == AccountStatus.PendingApproval ? "warning"
                    : "info";
                events.Add(
                    new AuditLogEntry(
                        Id: Guid.NewGuid(),
                        EventType: "merchant",
                        Severity: severity,
                        Message: $"Merchant '{m.StoreName}' ({m.UserEmail}) — active: {m.IsActive}, status: {m.UserStatus}",
                        ActorId: m.UserId,
                        ResourceId: m.Id,
                        OccurredAt: m.UpdatedAt
                    )
                );
            }
        }

        // Product approval/rejection events
        if (eventType is null or "product")
        {
            var products = await _db
                .Products.Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.UpdatedAt)
                .Take(100)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.IsApproved,
                    p.UpdatedAt,
                    MerchantId = p.MerchantId,
                })
                .ToListAsync();

            foreach (var p in products)
            {
                events.Add(
                    new AuditLogEntry(
                        Id: Guid.NewGuid(),
                        EventType: "product",
                        Severity: p.IsApproved ? "info" : "warning",
                        Message: $"Product '{p.Name}' — approved: {p.IsApproved}",
                        ActorId: p.MerchantId,
                        ResourceId: p.Id,
                        OccurredAt: p.UpdatedAt
                    )
                );
            }
        }

        // Sort by date and paginate
        var sorted = events
            .OrderByDescending(e => e.OccurredAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToList();

        return Ok(
            new
            {
                total = events.Count,
                page,
                limit,
                items = sorted,
            }
        );
    }

    // ── USERS ─────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null
    )
    {
        var query = _db.Users.Where(u => !u.IsDeleted).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u =>
                EF.Functions.ILike(u.Email, $"%{search}%")
                || EF.Functions.ILike(u.FirstName, $"%{search}%")
                || EF.Functions.ILike(u.LastName, $"%{search}%")
            );

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            query = query.Where(u => u.Role == parsedRole);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                Role = u.Role.ToString(),
                IsEmailVerified = u.IsVerified,
                u.IsDeleted,
                u.CreatedAt,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                page,
                limit,
                items,
            }
        );
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record RejectMerchantDto(string Reason);

public record RejectProductAdminDto(string? Reason);

public record CreateMerchantDto(
    string Email,
    string Password,
    string StoreName,
    string Slug,
    double Latitude,
    double Longitude,
    int? HandlingHours
);

public record UpdateMerchantDto(
    string? StoreName,
    double? Latitude,
    double? Longitude,
    int? HandlingHours,
    string? Plan
);

public record UpdateStatusDto(string Status);

public record AdminStoreSetupDto(
    string? StoreName,
    string? Slug,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    int? HandlingHours,
    double? Latitude,
    double? Longitude
);

public record AuditLogEntry(
    Guid Id,
    string EventType,
    string Severity,
    string Message,
    Guid ActorId,
    Guid ResourceId,
    DateTime OccurredAt
);
