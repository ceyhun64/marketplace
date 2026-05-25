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
[Authorize(Policy = "MerchantOnly")]
public class MerchantsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IConfiguration _config;

    public MerchantsController(
        AppDbContext db,
        ICurrentUserService currentUser,
        IConfiguration config
    )
    {
        _db = db;
        _currentUser = currentUser;
        _config = config;
    }

    // ── PROFILE ──────────────────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var merchant = await _db
            .MerchantProfiles.Include(m => m.User)
            .Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        return Ok(
            new
            {
                merchant.Id,
                merchant.UserId,
                merchant.StoreName,
                merchant.Slug,
                merchant.LogoUrl,
                merchant.BannerUrl,
                merchant.Description,
                merchant.CustomDomain,
                DomainVerified = merchant.DomainVerified,
                merchant.Latitude,
                merchant.Longitude,
                merchant.HandlingHours,
                merchant.IsActive,
                IsSuspended = !merchant.IsActive,
                merchant.CreatedAt,
                SubscriptionPlan = merchant.Subscription?.Plan.ToString() ?? "BASIC",
                SubscriptionId = merchant.Subscription?.Id,
                User = new { merchant.User.Email },
                Subscription = merchant.Subscription == null
                    ? null
                    : new
                    {
                        merchant.Subscription.Plan,
                        merchant.Subscription.ExpiresAt,
                        merchant.Subscription.IsActive,
                    },
            }
        );
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var merchant = await _db
            .MerchantProfiles.Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return NotFound();

        // Logo / banner yükleme için Pro veya Enterprise plan gereklidir
        if ((dto.LogoUrl != null || dto.BannerUrl != null))
        {
            var hasPro =
                merchant.Subscription != null
                && merchant.Subscription.IsActive
                && merchant.Subscription.ExpiresAt > DateTime.UtcNow
                && merchant.Subscription.Plan != PlanType.Basic;

            if (!hasPro)
                return BadRequest(
                    new
                    {
                        message = "Logo ve banner yüklemek için Pro veya Enterprise plan gereklidir.",
                        requiredPlan = "Pro",
                    }
                );
        }

        if (dto.StoreName != null)
            merchant.StoreName = dto.StoreName;
        if (dto.Description != null)
            merchant.Description = dto.Description;
        if (dto.Latitude.HasValue)
            merchant.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue)
            merchant.Longitude = dto.Longitude.Value;
        if (dto.HandlingHours.HasValue)
            merchant.HandlingHours = dto.HandlingHours.Value;
        if (dto.LogoUrl != null)
            merchant.LogoUrl = dto.LogoUrl;
        if (dto.BannerUrl != null)
            merchant.BannerUrl = dto.BannerUrl;
        merchant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                merchant.Id,
                merchant.StoreName,
                merchant.Description,
                merchant.LogoUrl,
                merchant.BannerUrl,
                merchant.HandlingHours,
                message = "Profil güncellendi.",
            }
        );
    }

    // ── CATALOGUE (Products) ──────────────────────────────────────────────────

    [HttpGet("catalogue")]
    public async Task<IActionResult> GetCatalogue(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] bool? publishedToMarket = null,
        [FromQuery] bool? publishedToStore = null,
        [FromQuery] bool? isApproved = null,
        [FromQuery] bool? outOfStock = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sort = null
    )
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        // Base query (all products, no publish filters) for aggregate stats
        var allProductsQuery = _db.Products.Where(p => p.MerchantId == merchant.Id && !p.IsDeleted);

        var statsOnMarket = await allProductsQuery.CountAsync(p => p.PublishToMarket);
        var statsOnStore = await allProductsQuery.CountAsync(p => p.PublishToStore);
        var statsPendingApproval = await allProductsQuery.CountAsync(p => !p.IsApproved);
        var statsOutOfStock = await allProductsQuery.CountAsync(p => p.Stock == 0);
        var statsTotal = await allProductsQuery.CountAsync();

        // Filtered query for pagination
        var query = allProductsQuery.Include(p => p.Category).AsQueryable();

        if (publishedToMarket.HasValue)
            query = query.Where(p => p.PublishToMarket == publishedToMarket.Value);
        if (publishedToStore.HasValue)
            query = query.Where(p => p.PublishToStore == publishedToStore.Value);
        if (isApproved.HasValue)
            query = query.Where(p => p.IsApproved == isApproved.Value);
        if (outOfStock == true)
            query = query.Where(p => p.Stock == 0);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));

        var total = await query.CountAsync();
        IOrderedQueryable<Product> orderedQuery = sort switch
        {
            "price_asc"     => query.OrderBy(p => p.Price),
            "price_desc"    => query.OrderByDescending(p => p.Price),
            "stock_asc"     => query.OrderBy(p => p.Stock),
            "name_asc"      => query.OrderBy(p => p.Name),
            "createdAt_asc" => query.OrderBy(p => p.CreatedAt),
            _               => query.OrderByDescending(p => p.CreatedAt),
        };
        var items = await orderedQuery
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                p.PublishToMarket,
                p.PublishToStore,
                p.IsApproved,
                p.CreatedAt,
                Category = p.Category == null ? null : p.Category.Name,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                totalCount = total,
                page,
                limit,
                items,
                stats = new
                {
                    total = statsTotal,
                    onMarket = statsOnMarket,
                    onStore = statsOnStore,
                    pendingApproval = statsPendingApproval,
                    outOfStock = statsOutOfStock,
                },
            }
        );
    }

    [HttpPost("catalogue")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var merchant = await _db
            .MerchantProfiles.Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return NotFound(new { message = "Merchant profili bulunamadı." });

        var category = await _db.Categories.FindAsync(dto.CategoryId);
        if (category == null)
            return BadRequest(new { message = "Kategori bulunamadı." });

        // ── Abonelik planına göre ürün limiti kontrolü ────────────────────────
        var subscription = merchant.Subscription;
        var plan = subscription?.Plan ?? PlanType.Basic;
        var isActiveSub =
            subscription != null
            && subscription.IsActive
            && subscription.ExpiresAt > DateTime.UtcNow;

        int? productLimit = plan switch
        {
            PlanType.Basic => 50,
            PlanType.Pro => 500,
            PlanType.Enterprise => null, // Sınırsız
            _ => 50,
        };

        if (productLimit.HasValue)
        {
            var currentProductCount = await _db.Products.CountAsync(p =>
                p.MerchantId == merchant.Id && !p.IsDeleted
            );

            if (currentProductCount >= productLimit.Value)
                return BadRequest(
                    new
                    {
                        message = $"Mevcut planınızda ({plan}) en fazla {productLimit} ürün ekleyebilirsiniz. Daha fazlası için planınızı yükseltin.",
                        currentCount = currentProductCount,
                        limit = productLimit.Value,
                        requiredPlan = plan == PlanType.Basic ? "Pro" : "Enterprise",
                    }
                );
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchant.Id,
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            Images = dto.Images ?? [],
            Tags = dto.Tags ?? [],
            Price = dto.Price,
            Stock = dto.Stock,
            PublishToMarket = dto.PublishToMarket ?? false,
            PublishToStore = dto.PublishToStore ?? true,
            IsApproved = true,
            ModerationStatus = ModerationStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // Cache invalidation — fire-and-forget
        _ = Task.Run(async () =>
        {
            try
            {
                var redis = HttpContext.RequestServices.GetService<StackExchange.Redis.IConnectionMultiplexer>();
                if (redis != null)
                {
                    var rdb = redis.GetDatabase();
                    await Task.WhenAll(
                        rdb.KeyDeleteAsync($"products:merchant:{merchant.Id}"),
                        rdb.KeyDeleteAsync("products:featured"),
                        rdb.KeyDeleteAsync("products:listing"));
                }

                var webhookUrl = _config["FRONTEND_URL"];
                var secret     = _config["REVALIDATION_SECRET"];
                if (!string.IsNullOrEmpty(webhookUrl) && !string.IsNullOrEmpty(secret))
                {
                    using var http = new System.Net.Http.HttpClient();
                    await http.PostAsync(
                        $"{webhookUrl}/api/revalidate",
                        new System.Net.Http.StringContent(
                            System.Text.Json.JsonSerializer.Serialize(new
                            {
                                secret,
                                tags = new[] { "products", $"merchant-products-{merchant.Id}" },
                            }),
                            System.Text.Encoding.UTF8,
                            "application/json"));
                }
            }
            catch (Exception ex)
            {
                var logger = HttpContext.RequestServices.GetService<ILogger<MerchantsController>>();
                logger?.LogWarning(ex, "Cache invalidation failed after CreateProduct MerchantId={Id}", merchant.Id);
            }
        });

        return CreatedAtAction(
            nameof(GetCatalogue),
            null,
            new
            {
                product.Id,
                product.Name,
                product.Price,
                product.Stock,
                product.IsApproved,
                product.PublishToMarket,
                product.PublishToStore,
            }
        );
    }

    [HttpPut("catalogue/{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == merchant.Id
        );

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.Name = dto.Name ?? product.Name;
        product.Description = dto.Description ?? product.Description;
        product.Price = dto.Price ?? product.Price;
        product.Stock = dto.Stock ?? product.Stock;
        product.Images = dto.Images ?? product.Images;
        product.Tags = dto.Tags ?? product.Tags;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Cache invalidation — fire-and-forget
        _ = Task.Run(async () =>
        {
            try
            {
                var redis = HttpContext.RequestServices.GetService<StackExchange.Redis.IConnectionMultiplexer>();
                if (redis != null)
                {
                    var rdb = redis.GetDatabase();
                    await Task.WhenAll(
                        rdb.KeyDeleteAsync($"product:{product.Id}"),
                        rdb.KeyDeleteAsync($"products:merchant:{product.MerchantId}"),
                        rdb.KeyDeleteAsync("products:listing"));
                }

                var webhookUrl = _config["FRONTEND_URL"];
                var secret     = _config["REVALIDATION_SECRET"];
                if (!string.IsNullOrEmpty(webhookUrl) && !string.IsNullOrEmpty(secret))
                {
                    using var http = new System.Net.Http.HttpClient();
                    await http.PostAsync(
                        $"{webhookUrl}/api/revalidate",
                        new System.Net.Http.StringContent(
                            System.Text.Json.JsonSerializer.Serialize(new
                            {
                                secret,
                                tags = new[] { $"product-{product.Id}", "products" },
                            }),
                            System.Text.Encoding.UTF8,
                            "application/json"));
                }
            }
            catch (Exception ex)
            {
                var logger = HttpContext.RequestServices.GetService<ILogger<MerchantsController>>();
                logger?.LogWarning(ex, "Cache invalidation failed after UpdateProduct Id={Id}", product.Id);
            }
        });

        return Ok(
            new
            {
                product.Id,
                product.Name,
                product.Price,
                product.Stock,
            }
        );
    }

    [HttpPatch("catalogue/{id:guid}/publish")]
    public async Task<IActionResult> TogglePublish(Guid id, [FromBody] PublishToggleDto dto)
    {
        var merchant = await _db
            .MerchantProfiles.Include(m => m.Subscription)
            .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

        if (merchant == null)
            return NotFound();

        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == merchant.Id
        );

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        if (dto.PublishToMarket.HasValue)
            product.PublishToMarket = dto.PublishToMarket.Value;
        if (dto.PublishToStore.HasValue)
            product.PublishToStore = dto.PublishToStore.Value;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                product.Id,
                product.PublishToMarket,
                product.PublishToStore,
                message = "Yayın durumu güncellendi.",
            }
        );
    }

    [HttpDelete("catalogue/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == merchant.Id
        );

        if (product == null)
            return NotFound();

        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── ORDERS ───────────────────────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetIncomingOrders(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var query = _db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Customer)
            .Where(o => o.Items.Any(i => i.MerchantId == merchant.Id))
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var ps))
            query = query.Where(o => o.Status == ps);

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
                o.ShippingRate,
                o.Source,
                o.CreatedAt,
                Customer = new { o.Customer.Email },
                MyItems = o
                    .Items.Where(i => i.MerchantId == merchant.Id)
                    .Select(i => new
                    {
                        i.Quantity,
                        i.UnitPrice,
                        i.ProductName,
                    }),
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

    [HttpPatch("orders/{id:guid}/pack")]
    public async Task<IActionResult> MarkPacked(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var order = await _db
            .Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.Items.Any(i => i.MerchantId == merchant.Id));

        if (order == null)
            return NotFound(new { message = "Sipariş bulunamadı." });

        if (order.Status != OrderStatus.PaymentConfirmed)
            return BadRequest(
                new { message = $"Bu sipariş '{order.Status}' durumunda, hazırlanamaz." }
            );

        order.Status = OrderStatus.LabelGenerated;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(
            new
            {
                order.Id,
                order.Status,
                message = "Sipariş hazırlandı olarak işaretlendi.",
            }
        );
    }

    // ── ANALYTICS ────────────────────────────────────────────────────────────

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] string period = "month")
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var from = period switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddDays(-30),
            "year" => DateTime.UtcNow.AddDays(-365),
            _ => DateTime.UtcNow.AddDays(-30),
        };

        var orders = await _db
            .Orders.Include(o => o.Items)
            .Where(o =>
                o.CreatedAt >= from
                && o.Status != OrderStatus.Cancelled
                && o.Items.Any(i => i.MerchantId == merchant.Id)
            )
            .ToListAsync();

        var mpOrders = orders.Where(o => o.Source == OrderSource.Marketplace).ToList();
        var esOrders = orders.Where(o => o.Source == OrderSource.EStore).ToList();

        decimal Revenue(List<Order> list) =>
            list.SelectMany(o => o.Items.Where(i => i.MerchantId == merchant.Id))
                .Sum(i => i.UnitPrice * i.Quantity);

        return Ok(
            new
            {
                period,
                marketplace = new { orderCount = mpOrders.Count, revenue = Revenue(mpOrders) },
                estore = new { orderCount = esOrders.Count, revenue = Revenue(esOrders) },
                total = new { orderCount = orders.Count, revenue = Revenue(orders) },
            }
        );
    }

    [HttpGet("analytics/top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 5)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var topProducts = await _db
            .OrderItems.Include(i => i.Product)
            .Include(i => i.Order)
            .Where(i => i.MerchantId == merchant.Id && i.Order.Status != OrderStatus.Cancelled)
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalSold = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity),
            })
            .OrderByDescending(g => g.TotalSold)
            .Take(limit)
            .ToListAsync();

        return Ok(topProducts);
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? period = null
    )
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var query = _db
            .Invoices.Include(i => i.Order)
            .Where(i => i.MerchantId == merchant.Id)
            .AsQueryable();

        // Period filtresi
        if (!string.IsNullOrEmpty(period))
        {
            var since = period.ToLower() switch
            {
                "week" => DateTime.UtcNow.AddDays(-7),
                "month" => DateTime.UtcNow.AddDays(-30),
                "year" => DateTime.UtcNow.AddDays(-365),
                _ => DateTime.MinValue,
            };
            if (since != DateTime.MinValue)
                query = query.Where(i => i.IssuedAt >= since);
        }

        var total = await query.CountAsync();
        var totalRevenue = await query.SumAsync(i => (decimal?)i.TotalAmount) ?? 0m;

        var invoices = await query
            .OrderByDescending(i => i.IssuedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.OrderId,
                OrderNumber = i.Order != null
                    ? i.Order.Id.ToString().Substring(0, 8).ToUpper()
                    : string.Empty,
                i.SubTotal,
                i.VatRate,
                i.VatAmount,
                i.ShippingAmount,
                i.TotalAmount,
                i.PdfUrl,
                i.IsSent,
                i.IssuedAt,
                Source = i.Order != null ? i.Order.Source.ToString() : string.Empty,
                CustomerName = i.CustomerFullName,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                totalRevenue,
                page,
                limit,
                invoices,
            }
        );
    }

    // ── GET /merchants/invoices/{id}/download — Merchant: fatura PDF indir ───
    [HttpGet("invoices/{id:guid}/download")]
    public async Task<IActionResult> DownloadInvoice(Guid id)
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound();

        var invoice = await _db.Invoices.FirstOrDefaultAsync(i =>
            i.Id == id && i.MerchantId == merchant.Id
        );

        if (invoice == null)
            return NotFound(new { message = "Fatura bulunamadı." });

        if (string.IsNullOrEmpty(invoice.PdfUrl))
            return NotFound(new { message = "Fatura PDF'i henüz oluşturulmadı." });

        // Cloudinary URL'i döndür (frontend redirect ile indirir)
        return Ok(
            new
            {
                invoiceNumber = invoice.InvoiceNumber,
                pdfUrl = invoice.PdfUrl,
                issuedAt = invoice.IssuedAt,
            }
        );
    }

    private async Task<MerchantProfile?> GetCurrentMerchantAsync() =>
        await _db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId);

    // ── Stripe Connect Onboarding ─────────────────────────────────────────────

    /// <summary>
    /// POST /api/merchants/connect/onboard
    /// Creates a Stripe Express account and returns an onboarding link.
    /// The merchant must complete Stripe's onboarding before payouts can be received.
    /// </summary>
    [HttpPost("connect/onboard")]
    public async Task<IActionResult> StripeConnectOnboard()
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null)
            return NotFound(new { message = "Merchant profile not found." });

        // If already onboarded, return the status
        if (merchant.StripeOnboardingComplete)
            return Ok(
                new { onboardingComplete = true, stripeAccountId = merchant.StripeAccountId }
            );

        var stripeKey =
            _config["Stripe:SecretKey"]
            ?? throw new InvalidOperationException("Stripe secret key not configured.");

        Stripe.StripeConfiguration.ApiKey = stripeKey;

        // Create a Stripe Express account if not already created
        if (string.IsNullOrEmpty(merchant.StripeAccountId))
        {
            var accountService = new Stripe.AccountService();
            var account = await accountService.CreateAsync(
                new Stripe.AccountCreateOptions
                {
                    Type = "express",
                    Country = merchant.Country ?? "TR",
                    Email = (await _db.Users.FindAsync(merchant.UserId))?.Email,
                    Capabilities = new Stripe.AccountCapabilitiesOptions
                    {
                        CardPayments = new Stripe.AccountCapabilitiesCardPaymentsOptions
                        {
                            Requested = true,
                        },
                        Transfers = new Stripe.AccountCapabilitiesTransfersOptions
                        {
                            Requested = true,
                        },
                    },
                }
            );

            merchant.StripeAccountId = account.Id;
            await _db.SaveChangesAsync();
        }

        // Generate an onboarding link
        var linkService = new Stripe.AccountLinkService();
        var link = await linkService.CreateAsync(
            new Stripe.AccountLinkCreateOptions
            {
                Account = merchant.StripeAccountId,
                RefreshUrl = $"{_config["App:BaseUrl"]}/merchant/stripe/refresh",
                ReturnUrl = $"{_config["App:BaseUrl"]}/merchant/stripe/return",
                Type = "account_onboarding",
            }
        );

        return Ok(
            new
            {
                onboardingComplete = false,
                stripeAccountId = merchant.StripeAccountId,
                onboardingUrl = link.Url,
            }
        );
    }

    /// <summary>
    /// POST /api/merchants/connect/onboard/complete
    /// Called after Stripe redirects back — checks if onboarding is done.
    /// </summary>
    [HttpPost("connect/onboard/complete")]
    public async Task<IActionResult> StripeConnectComplete()
    {
        var merchant = await GetCurrentMerchantAsync();
        if (merchant == null || string.IsNullOrEmpty(merchant.StripeAccountId))
            return BadRequest(new { message = "Stripe onboarding not started." });

        var stripeKey =
            _config["Stripe:SecretKey"]
            ?? throw new InvalidOperationException("Stripe secret key not configured.");
        Stripe.StripeConfiguration.ApiKey = stripeKey;

        var accountService = new Stripe.AccountService();
        var account = await accountService.GetAsync(merchant.StripeAccountId);

        if (account.DetailsSubmitted)
        {
            merchant.StripeOnboardingComplete = true;
            merchant.StripeOnboardedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok(
            new
            {
                onboardingComplete = merchant.StripeOnboardingComplete,
                stripeAccountId = merchant.StripeAccountId,
            }
        );
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record UpdateProfileDto(
    string? StoreName,
    string? Description,
    double? Latitude,
    double? Longitude,
    int? HandlingHours,
    string? LogoUrl,
    string? BannerUrl
);

public record CreateProductDto(
    string Name,
    string Description,
    Guid CategoryId,
    decimal Price,
    int Stock,
    List<string>? Images,
    List<string>? Tags,
    bool? PublishToMarket,
    bool? PublishToStore
);

public record UpdateProductDto(
    string? Name,
    string? Description,
    decimal? Price,
    int? Stock,
    List<string>? Images,
    List<string>? Tags
);

public record PublishToggleDto(bool? PublishToMarket, bool? PublishToStore);
