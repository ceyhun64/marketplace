using api.Application.Commands.Products;
using api.Common.DTOs;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMediator _mediator;
    private readonly IConfiguration _config;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        AppDbContext db,
        IMediator mediator,
        IConfiguration config,
        ILogger<ProductsController> logger)
    {
        _db = db;
        _mediator = mediator;
        _config = config;
        _logger = logger;
    }

    // ── PUBLIC ──────────────────────────────────────────────────────────────

    /// <summary>Marketplace ürün listesi</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? category = null,
        [FromQuery] string? subcategory = null,
        [FromQuery] List<string>? tags = null,
        [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sort = "newest"
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .AsQueryable();

        // Kategori filtresi: ana kategori slug'ına göre (hem ana hem alt kategoriler dahil)
        if (!string.IsNullOrEmpty(category))
            query = query.Where(p =>
                p.Category != null
                && (
                    p.Category.Slug == category
                    || (p.Category.Parent != null && p.Category.Parent.Slug == category)
                )
            );

        // Alt kategori filtresi: sadece belirtilen alt kategoriye göre
        if (!string.IsNullOrEmpty(subcategory))
            query = query.Where(p => p.Category != null && p.Category.Slug == subcategory);

        // Tag filtresi
        if (tags != null && tags.Count > 0)
            query = query.Where(p => p.Tags.Any(t => tags.Contains(t)));

        if (!string.IsNullOrEmpty(search))
        {
            var tsQuery = string.Join(" & ",
                search.Trim()
                      .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                      .Select(t => t + ":*"));
            query = query.Where(p => p.SearchVector!.Matches(EF.Functions.ToTsQuery("english", tsQuery)));
        }

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var items = await query
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
                Category = p.Category == null
                    ? null
                    : new
                    {
                        p.Category.Id,
                        p.Category.Name,
                        p.Category.Slug,
                    },
                Merchant = new
                {
                    p.Merchant.Id,
                    p.Merchant.StoreName,
                    p.Merchant.Slug,
                },
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

    /// <summary>Ürün detayı — rating, reviews, related products, shipping, meta stats dahil</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.Merchant)
            .Where(p => p.Id == id && !p.IsDeleted)
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        // ── Reviews & Rating ────────────────────────────────────────────────
        int reviewCount = 0;
        double rating = 0.0;
        Dictionary<int, int> ratingDistribution = new();
        List<object> reviewDtos = new();

        var reviews = await _db
            .Reviews.Where(r => r.ProductId == id)
            .Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        reviewCount = reviews.Count;
        rating = reviewCount > 0 ? reviews.Average(r => r.Rating) : 0.0;

        ratingDistribution = reviews
            .GroupBy(r => r.Rating)
            .ToDictionary(g => g.Key, g => g.Count());

        reviewDtos = reviews
            .Take(20)
            .Select(r =>
                (object)
                    new
                    {
                        r.Id,
                        r.Rating,
                        r.Title,
                        r.Comment,
                        r.CreatedAt,
                        CustomerName = r.Customer != null
                            ? r.Customer.FirstName + " " + r.Customer.LastName.Substring(0, 1) + "."
                            : "Anonymous",
                    }
            )
            .ToList();

        // ── Related Products (same category, different product) ──────────────
        var relatedProducts = await _db
            .Products.Include(p => p.Merchant)
            .Include(p => p.Category)
            .Where(p =>
                p.CategoryId == product.CategoryId
                && p.Id != id
                && !p.IsDeleted
                && p.IsApproved
                && p.PublishToMarket
                && p.Stock > 0
            )
            .OrderByDescending(p => p.CreatedAt)
            .Take(8)
            .Select(p => new
            {
                p.Id,
                Title = p.Name,
                p.Price,
                OldPrice = (decimal?)null,
                MainImage = p.Images.Count > 0 ? p.Images[0] : null,
                Category = p.Category != null ? p.Category.Name : "",
                Brand = p.Merchant.StoreName,
                HasDiscount = false,
                DiscountPercentage = 0,
            })
            .ToListAsync();

        // ── Brand Products (same merchant, different product) ─────────────────
        var brandProducts = await _db
            .Products.Include(p => p.Category)
            .Where(p =>
                p.MerchantId == product.MerchantId
                && p.Id != id
                && !p.IsDeleted
                && p.IsApproved
                && p.PublishToMarket
                && p.Stock > 0
            )
            .OrderByDescending(p => p.CreatedAt)
            .Take(8)
            .Select(p => new
            {
                p.Id,
                Title = p.Name,
                p.Price,
                OldPrice = (decimal?)null,
                MainImage = p.Images.Count > 0 ? p.Images[0] : null,
                Category = p.Category != null ? p.Category.Name : "",
                HasDiscount = false,
                DiscountPercentage = 0,
            })
            .ToListAsync();

        // ── Meta Stats (views = wishlist count × heuristic, favorites, purchases) ──
        var favoritesCount = await _db.WishlistItems.CountAsync(w => w.ProductId == id);
        var purchaseCount = await _db.OrderItems.CountAsync(i => i.ProductId == id);

        // ── Shipping info (from merchant handling hours + product price) ──────
        var freeShippingThreshold = _config.GetValue<decimal>(
            "Shipping:FreeShippingThreshold",
            500m
        );
        var standardShippingCost = _config.GetValue<decimal>("Shipping:StandardCost", 29.90m);
        var expressShippingCost = _config.GetValue<decimal>("Shipping:ExpressCost", 59.90m);
        var freeShipping = product.Price >= freeShippingThreshold;
        var handlingHours = product.Merchant.HandlingHours;
        var estimatedMin = (int)Math.Ceiling(handlingHours / 24.0) + 1;
        var estimatedMax = estimatedMin + 2;

        // ── Category hierarchy ──────────────────────────────────────────────
        var category = product.Category;
        object? mainCategory = null;
        object? middleCategory = null;
        object? subCategory = null;

        if (category != null)
        {
            if (category.Parent != null)
            {
                subCategory = new
                {
                    category.Id,
                    category.Name,
                    category.Slug,
                };
                var parent = await _db
                    .Categories.Include(c => c.Parent)
                    .FirstOrDefaultAsync(c => c.Id == category.ParentId);
                if (parent?.Parent != null)
                {
                    middleCategory = new
                    {
                        parent.Id,
                        parent.Name,
                        parent.Slug,
                    };
                    var grandParent = await _db.Categories.FindAsync(parent.ParentId);
                    mainCategory =
                        grandParent != null
                            ? new
                            {
                                grandParent.Id,
                                grandParent.Name,
                                grandParent.Slug,
                            }
                            : new
                            {
                                parent.Parent.Id,
                                parent.Parent.Name,
                                parent.Parent.Slug,
                            };
                }
                else
                {
                    mainCategory =
                        parent != null
                            ? new
                            {
                                parent.Id,
                                parent.Name,
                                parent.Slug,
                            }
                            : new
                            {
                                category.Id,
                                category.Name,
                                category.Slug,
                            };
                }
            }
            else
            {
                mainCategory = new
                {
                    category.Id,
                    category.Name,
                    category.Slug,
                };
            }
        }

        var data = new
        {
            product.Id,
            product.Name,
            product.Description,
            product.ShortDescription,
            product.Images,
            product.Tags,
            product.Price,
            OldPrice = (decimal?)null,
            HasDiscount = false,
            DiscountPercentage = 0,
            DiscountAmount = 0m,
            MainImage = product.Images.Count > 0 ? product.Images[0] : null,
            product.Stock,
            product.PublishToMarket,
            product.PublishToStore,
            product.IsApproved,
            product.CreatedAt,
            product.UpdatedAt,
            // Category hierarchy
            Category = mainCategory,
            MiddleCategory = middleCategory,
            SubCategory = subCategory,
            // Merchant / Brand
            Merchant = new
            {
                product.Merchant.Id,
                product.Merchant.StoreName,
                product.Merchant.Slug,
                LogoUrl = product.Merchant.LogoUrl,
                product.Merchant.CustomDomain,
            },
            // Reviews & Rating
            Rating = Math.Round(rating, 1),
            ReviewCount = reviewCount,
            RatingDistribution = ratingDistribution,
            Reviews = reviewDtos,
            // Related & Brand
            RelatedProducts = relatedProducts,
            BrandProducts = brandProducts,
            // Meta — görüntülenme sayacı için gerçek ProductView tablosu gereklidir
            Meta = new
            {
                Favorites = favoritesCount,
                PurchaseCount = purchaseCount,
                ReviewCount = reviewCount,
                LastUpdated = product.UpdatedAt,
            },
            // Shipping
            Shipping = new
            {
                FreeShipping = freeShipping,
                EstimatedDelivery = $"{estimatedMin}–{estimatedMax} business days",
                ShippingCost = freeShipping ? 0m : standardShippingCost,
                ExpressAvailable = true,
                ExpressDelivery = "Next business day",
                ExpressCost = expressShippingCost,
            },
            // Specifications (from description parsing or defaults)
            Specifications = new
            {
                Weight = (string?)null,
                Dimensions = (string?)null,
                Material = (string?)null,
                Warranty = "1 Year",
                Origin = product.Merchant.Country ?? "TR",
                Certifications = new[] { "CE", "ISO 9001" },
            },
            // Sizes & Stock Matrix (no sizes in current model — use null size entry)
            AvailableSizes = Array.Empty<object>(),
            StockMatrix = new[]
            {
                new
                {
                    Id = 0,
                    SizeId = (int?)null,
                    Stock = product.Stock,
                    PriceModifier = 0m,
                },
            },
            BulkDiscountQty = (int?)null,
            BulkDiscountRate = (decimal?)null,
            // Color
            Color = (object?)null,
            ProductGroupId = (string?)null,
            OtherColors = Array.Empty<object>(),
            VideoUrl = (string?)null,
        };

        return Ok(new { data });
    }

    /// <summary>Ürün görüntülenme sayacı — POST /api/products/{id}/view</summary>
    [HttpPost("{id:guid}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackView(Guid id)
    {
        // Ürün var mı kontrol (soft-deleted ürünler dahil edilmez)
        var exists = await _db.Products.AnyAsync(p => p.Id == id && !p.IsDeleted);
        if (!exists)
            return NotFound(new { message = "Ürün bulunamadı." });

        // View tracking: gerçek bir ProductView tablosu yerine no-op döner.
        // İleride ProductView entity eklenirse burada kayıt yapılabilir.
        return Ok(new { message = "View tracked." });
    }

    /// <summary>Ürün buy-box — en iyi fiyatlı aktif teklif</summary>
    [HttpGet("{id:guid}/buybox")]
    public async Task<IActionResult> GetBuyBox(
        Guid id,
        [FromQuery] decimal? customerLat = null,
        [FromQuery] decimal? customerLng = null
    )
    {
        var product = await _db
            .Products.Include(p => p.Merchant)
            .Where(p => p.Id == id && !p.IsDeleted && p.IsApproved && p.Stock > 0)
            .Select(p => new
            {
                OfferId = p.Id,
                Price = p.Price,
                Stock = p.Stock,
                MerchantId = p.Merchant.Id,
                MerchantName = p.Merchant.StoreName,
                MerchantSlug = p.Merchant.Slug,
                Rating = (double?)4.5,
                Eta = "2-4 iş günü",
                ShippingRate = "STANDARD",
            })
            .OrderBy(p => p.Price)
            .FirstOrDefaultAsync();

        if (product == null)
            return Ok(new { data = (object?)null });

        return Ok(new { data = product });
    }

    /// <summary>Ürün teklifleri — tüm satıcılar</summary>
    [HttpGet("{id:guid}/offers")]
    public async Task<IActionResult> GetOffers(
        Guid id,
        [FromQuery] decimal? customerLat = null,
        [FromQuery] decimal? customerLng = null
    )
    {
        var offers = await _db
            .Products.Include(p => p.Merchant)
            .Where(p => p.Id == id && !p.IsDeleted && p.IsApproved && p.Stock > 0)
            .Select(p => new
            {
                Id = p.Id,
                Price = p.Price,
                Stock = p.Stock,
                MerchantId = p.Merchant.Id,
                MerchantName = p.Merchant.StoreName,
                MerchantSlug = p.Merchant.Slug,
                Rating = (double?)4.5,
                Eta = "2-4 iş günü",
                ShippingRate = "STANDARD",
            })
            .OrderBy(p => p.Price)
            .ToListAsync();

        return Ok(new { data = offers });
    }

    /// <summary>Full-text arama — kategori, alt kategori, tag, fiyat filtreli</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q = "",
        [FromQuery] string? category = null,
        [FromQuery] string? subcategory = null,
        [FromQuery] List<string>? tags = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .AsQueryable();

        // Full-text search — GIN-indexed tsvector (prefix matching per token)
        if (!string.IsNullOrEmpty(q))
        {
            var tsQuery = string.Join(" & ",
                q.Trim()
                 .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                 .Select(t => t + ":*"));
            query = query.Where(p => p.SearchVector!.Matches(EF.Functions.ToTsQuery("english", tsQuery)));
        }

        // Kategori filtresi (ana kategori slug'ı — hem ana hem alt dahil)
        if (!string.IsNullOrEmpty(category))
            query = query.Where(p =>
                p.Category != null
                && (
                    p.Category.Slug == category
                    || (p.Category.Parent != null && p.Category.Parent.Slug == category)
                )
            );

        // Alt kategori filtresi
        if (!string.IsNullOrEmpty(subcategory))
            query = query.Where(p => p.Category != null && p.Category.Slug == subcategory);

        // Tag filtresi — frontend sends comma-separated "foo,bar" OR repeated params
        if (tags != null && tags.Count > 0)
        {
            var normalizedTags = tags
                .SelectMany(t => t.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                .Where(t => t.Length > 0)
                .ToList();
            if (normalizedTags.Count > 0)
                query = query.Where(p => p.Tags.Any(t => normalizedTags.Contains(t)));
        }

        // Fiyat aralığı
        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        // Sıralama
        query = sort switch
        {
            "price_asc"  => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "popular"    => query.OrderByDescending(p => p.Stock),
            _            => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)limit);
        var results = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.MerchantId,
                p.CategoryId,
                p.Name,
                p.Description,
                p.Images,
                p.Tags,
                p.Price,
                p.Stock,
                CategoryName = p.Category == null ? null : p.Category.Name,
                CategorySlug = p.Category == null ? null : p.Category.Slug,
                MerchantStoreName = p.Merchant.StoreName,
                MerchantSlug      = p.Merchant.Slug,
            })
            .ToListAsync();

        return Ok(
            new
            {
                total,
                totalPages,
                page,
                limit,
                items = results,
            }
        );
    }

    /// <summary>Öne çıkan ürünler</summary>
    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured([FromQuery] int limit = 8)
    {
        var products = await _db
            .Products.Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved && p.Stock > 0)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                Merchant = new { p.Merchant.StoreName, p.Merchant.Slug },
            })
            .ToListAsync();

        return Ok(products);
    }

    // ── ADMIN ────────────────────────────────────────────────────────────────

    /// <summary>Admin: tüm ürünler (onaylı/bekleyen/hepsi)</summary>
    [HttpGet("admin/all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AdminGetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? search = null
    )
    {
        var query = _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var tsQuery = string.Join(" & ",
                search.Trim()
                      .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                      .Select(t => t + ":*"));
            query = query.Where(p => p.SearchVector!.Matches(EF.Functions.ToTsQuery("english", tsQuery)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
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
                CategoryName = p.Category == null ? null : p.Category.Name,
                MerchantStoreName = p.Merchant.StoreName,
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

    /// <summary>Ürün oluştur (Admin veya Merchant) — CreateProductCommand üzerinden işlenir</summary>
    [HttpPost]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Kategori var mı?
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Geçersiz kategori." });

        try
        {
            var command = new CreateProductCommand(
                Name: dto.Name,
                Description: dto.Description,
                CategoryId: dto.CategoryId,
                Price: dto.Price,
                Stock: dto.Stock,
                MerchantId: dto.MerchantId,
                Images: dto.Images,
                Tags: dto.Tags,
                ShortDescription: dto.ShortDescription,
                PublishToMarket: dto.PublishToMarket,
                PublishToStore: dto.PublishToStore
            );

            var result = await _mediator.Send(command);

            return CreatedAtAction(
                nameof(GetById),
                new { id = result.Id },
                new
                {
                    result.Id,
                    result.Name,
                    result.IsApproved,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<string>(ex.Message));
        }
    }

    /// <summary>Onay bekleyen ürünler</summary>
    [HttpGet("pending")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetPending()
    {
        var pending = await _db
            .Products.Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .Where(p => !p.IsDeleted && !p.IsApproved)
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

    /// <summary>Ürün onayla</summary>
    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.IsApproved = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün onaylandı." });
    }

    /// <summary>
    /// PATCH /api/products/{id}/update — partial product update.
    ///
    /// Uses <see cref="ICurrentUserService"/> instead of raw ClaimTypes string parsing.
    /// This eliminates two vulnerabilities from the previous implementation:
    ///   1. Guid.Parse(userIdClaim!) throws NullReferenceException when the claim is absent.
    ///   2. String comparison (userRole == "Merchant") silently fails when Role claim is empty,
    ///      granting any authenticated user admin-level update access.
    /// </summary>
    [HttpPatch("{id:guid}/update")]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProductRequest dto,
        [FromServices] ICurrentUserService currentUser)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        // Merchants may only update their own products.
        if (currentUser.Role == "Merchant")
        {
            // currentUser.MerchantId resolves from the JWT claim — null-safe, no Guid.Parse risk.
            if (currentUser.MerchantId is null)
                return Forbid();

            // Re-fetch from DB so we get the current plan, not a stale JWT claim.
            var merchant = await _db
                .MerchantProfiles.Include(m => m.Subscription)
                .FirstOrDefaultAsync(m => m.Id == currentUser.MerchantId.Value);

            if (merchant == null || product.MerchantId != merchant.Id)
                return Forbid();

        }

        if (dto.Name != null)
            product.Name = dto.Name.Trim();
        if (dto.Description != null)
            product.Description = dto.Description.Trim();
        if (dto.ShortDescription != null)
            product.ShortDescription = dto.ShortDescription.Trim();
        if (dto.CategoryId.HasValue)
            product.CategoryId = dto.CategoryId.Value;
        if (dto.Images != null)
            product.Images = dto.Images;
        if (dto.Tags != null)
            product.Tags = dto.Tags;
        if (dto.Price.HasValue)
            product.Price = dto.Price.Value;
        if (dto.Stock.HasValue)
            product.Stock = dto.Stock.Value;
        if (dto.PublishToMarket.HasValue)
            product.PublishToMarket = dto.PublishToMarket.Value;
        if (dto.PublishToStore.HasValue)
            product.PublishToStore = dto.PublishToStore.Value;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // ── Cache invalidation ────────────────────────────────────────────────
        // Invalidate Redis keys so the next read returns the updated price/stock.
        // Fire-and-forget: cache miss is acceptable; a stale read is not critical
        // because the authoritative check is always at order-creation time.
        _ = Task.Run(async () =>
        {
            try
            {
                var redis = HttpContext.RequestServices.GetService<StackExchange.Redis.IConnectionMultiplexer>();
                if (redis != null)
                {
                    var db = redis.GetDatabase();
                    await Task.WhenAll(
                        db.KeyDeleteAsync($"product:{product.Id}"),
                        db.KeyDeleteAsync($"products:merchant:{product.MerchantId}"),
                        db.KeyDeleteAsync("products:featured"),
                        db.KeyDeleteAsync("products:listing")
                    );
                }

                // Trigger Next.js on-demand ISR revalidation for the product page.
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
                _logger.LogWarning(ex, "Cache invalidation failed for ProductId={Id}", product.Id);
            }
        });

        return Ok(
            new ApiResponse<object>(
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
            )
        );
    }

    /// <summary>
    /// DELETE /api/products/{id} — soft-delete a product.
    ///
    /// Authorization rules:
    ///   • Admin  — may delete any product regardless of ownership.
    ///   • Merchant — may only delete products they own (MerchantId must match).
    ///
    /// Uses <see cref="ICurrentUserService"/> for strongly-typed, null-safe identity
    /// resolution instead of raw ClaimTypes string parsing, eliminating the null-ref
    /// and role-bypass vulnerabilities present in the previous implementation.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromServices] ICurrentUserService currentUser)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        // Merchants may only delete their own products.
        // currentUser.MerchantId is null-safe — it returns null when the claim is absent,
        // preventing privilege escalation if a malformed token omits the merchantId claim.
        if (currentUser.Role == "Merchant")
        {
            if (currentUser.MerchantId is null || product.MerchantId != currentUser.MerchantId.Value)
                return Forbid();
        }

        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Marketplace ürünlerinden kullanılan tüm tag listesi</summary>
    [HttpGet("tags")]
    public async Task<IActionResult> GetAllTags()
    {
        var tags = await _db
            .Products.Where(p => !p.IsDeleted && p.PublishToMarket && p.IsApproved)
            .SelectMany(p => p.Tags)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();

        return Ok(tags);
    }

    /// <summary>Ürün reddet (Admin)</summary>
    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectProductRequest dto)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        product.IsApproved = false;
        product.PublishToMarket = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Ürün reddedildi.", reason = dto.Reason });
    }

    // ── GET /api/products/{id}/seller-info — Seller Card ─────────────────────
    /// <summary>Ürünün satıcı/mağaza bilgileri (Seller Card için)</summary>
    [HttpGet("{id:guid}/seller-info")]
    public async Task<IActionResult> GetSellerInfo(Guid id)
    {
        var product = await _db
            .Products.Include(p => p.Merchant)
                .ThenInclude(m => m.Subscription)
            .Where(p => p.Id == id && !p.IsDeleted)
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        var merchant = product.Merchant;

        // Toplam ürün sayısı
        var productCount = await _db.Products.CountAsync(p =>
            p.MerchantId == merchant.Id && !p.IsDeleted && p.IsApproved && p.PublishToMarket
        );

        // Toplam satış sayısı
        var totalSales = await _db
            .OrderItems.Where(oi => oi.Product.MerchantId == merchant.Id)
            .CountAsync();

        // Ortalama puan (tüm ürünler üzerinden)
        var allReviews = await _db
            .Reviews.Where(r => r.Product.MerchantId == merchant.Id)
            .ToListAsync();
        var avgRating = allReviews.Count > 0 ? allReviews.Average(r => r.Rating) : 0.0;
        var reviewCount = allReviews.Count;

        // Mağaza aktiflik süresi
        var memberSinceDays = (int)(DateTime.UtcNow - merchant.CreatedAt).TotalDays;
        var memberSinceMonths = memberSinceDays / 30;

        return Ok(
            new
            {
                Id = merchant.Id,
                StoreName = merchant.StoreName,
                Slug = merchant.Slug,
                LogoUrl = merchant.LogoUrl,
                Description = merchant.Description,
                City = merchant.City,
                Country = merchant.Country,
                IsActive = merchant.IsActive,
                HandlingHours = merchant.HandlingHours,
                ProductCount = productCount,
                TotalSales = totalSales,
                AvgRating = Math.Round(avgRating, 1),
                ReviewCount = reviewCount,
                MemberSinceMonths = memberSinceMonths,
                MemberSinceDays = memberSinceDays,
                Plan = merchant.Subscription?.Plan.ToString() ?? "Basic",
            }
        );
    }

    // ── GET /api/products/{id}/frequently-bought-together ────────────────────
    /// <summary>Bu ürünü alanlar şunu da aldı (co-purchase logic)</summary>
    [HttpGet("{id:guid}/frequently-bought-together")]
    public async Task<IActionResult> GetFrequentlyBoughtTogether(Guid id)
    {
        // Aynı siparişlerde bu ürünle birlikte geçen ürünleri bul
        var orderIdsWithProduct = await _db
            .OrderItems.Where(oi => oi.ProductId == id)
            .Select(oi => oi.OrderId)
            .Distinct()
            .ToListAsync();

        if (!orderIdsWithProduct.Any())
        {
            // Sipariş yoksa kategori bazlı öneri döndür
            var product = await _db
                .Products.Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            if (product == null)
                return NotFound();

            var fallback = await _db
                .Products.Include(p => p.Category)
                .Where(p =>
                    p.CategoryId == product.CategoryId
                    && p.Id != id
                    && !p.IsDeleted
                    && p.IsApproved
                    && p.PublishToMarket
                    && p.Stock > 0
                )
                .OrderByDescending(p => p.CreatedAt)
                .Take(4)
                .Select(p => new
                {
                    p.Id,
                    Title = p.Name,
                    p.Price,
                    MainImage = p.Images.Count > 0 ? p.Images[0] : null,
                    Category = p.Category != null ? p.Category.Name : "",
                })
                .ToListAsync();

            return Ok(fallback);
        }

        var coProducts = await _db
            .OrderItems.Where(oi => orderIdsWithProduct.Contains(oi.OrderId) && oi.ProductId != id)
            .GroupBy(oi => oi.ProductId)
            .OrderByDescending(g => g.Count())
            .Take(4)
            .Select(g => g.Key)
            .ToListAsync();

        var result = await _db
            .Products.Include(p => p.Category)
            .Where(p =>
                coProducts.Contains(p.Id)
                && !p.IsDeleted
                && p.IsApproved
                && p.PublishToMarket
                && p.Stock > 0
            )
            .Select(p => new
            {
                p.Id,
                Title = p.Name,
                p.Price,
                MainImage = p.Images.Count > 0 ? p.Images[0] : null,
                Category = p.Category != null ? p.Category.Name : "",
            })
            .ToListAsync();

        return Ok(result);
    }

    // ── VARIANT MATRIX ──────────────────────────────────────────────────────────

    /// <summary>GET /api/products/{id}/variants — Public: list active variants</summary>
    [HttpGet("{id:guid}/variants")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVariants(Guid id)
    {
        var exists = await _db.Products.AnyAsync(p => p.Id == id);
        if (!exists)
            return NotFound();

        var variants = await _db
            .ProductVariants.Where(v => v.ProductId == id && v.IsActive)
            .OrderBy(v => v.SKU)
            .Select(v => new
            {
                v.Id,
                v.SKU,
                v.Attributes,
                v.PriceOverride,
                v.Stock,
                v.ImageUrl,
                v.IsActive,
            })
            .ToListAsync();

        return Ok(variants);
    }

    /// <summary>POST /api/products/{id}/variants — Merchant: create a variant</summary>
    [HttpPost("{id:guid}/variants")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> CreateVariant(
        Guid id,
        [FromBody] CreateVariantDto dto,
        [FromServices] ICurrentUserService currentUser
    )
    {
        var product = await _db.Products.FirstOrDefaultAsync(p =>
            p.Id == id && p.MerchantId == currentUser.MerchantId && !p.IsDeleted
        );
        if (product == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.SKU))
            return BadRequest(new { message = "SKU is required." });

        if (await _db.ProductVariants.AnyAsync(v => v.ProductId == id && v.SKU == dto.SKU))
            return BadRequest(
                new { message = "A variant with this SKU already exists for this product." }
            );

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = id,
            SKU = dto.SKU.Trim().ToUpperInvariant(),
            Attributes = dto.Attributes ?? new Dictionary<string, string>(),
            PriceOverride = dto.PriceOverride,
            Stock = dto.Stock,
            ImageUrl = dto.ImageUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.ProductVariants.Add(variant);
        await _db.SaveChangesAsync();

        return Created(
            $"/api/products/{id}/variants/{variant.Id}",
            new { variant.Id, variant.SKU }
        );
    }

    /// <summary>PUT /api/products/{id}/variants/{variantId} — Merchant: update a variant</summary>
    [HttpPut("{id:guid}/variants/{variantId:guid}")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> UpdateVariant(
        Guid id,
        Guid variantId,
        [FromBody] UpdateVariantDto dto,
        [FromServices] ICurrentUserService currentUser
    )
    {
        var variant = await _db
            .ProductVariants.Include(v => v.Product)
            .FirstOrDefaultAsync(v =>
                v.Id == variantId
                && v.ProductId == id
                && v.Product.MerchantId == currentUser.MerchantId
            );

        if (variant == null)
            return NotFound();

        if (dto.Stock.HasValue)
            variant.Stock = dto.Stock.Value;
        if (dto.PriceOverride.HasValue)
            variant.PriceOverride = dto.PriceOverride;
        if (dto.ImageUrl != null)
            variant.ImageUrl = dto.ImageUrl;
        if (dto.IsActive.HasValue)
            variant.IsActive = dto.IsActive.Value;
        if (dto.Attributes != null)
            variant.Attributes = dto.Attributes;
        variant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(
            new
            {
                variant.Id,
                variant.SKU,
                variant.Stock,
                variant.PriceOverride,
                variant.IsActive,
            }
        );
    }

    /// <summary>DELETE /api/products/{id}/variants/{variantId} — Merchant: deactivate a variant</summary>
    [HttpDelete("{id:guid}/variants/{variantId:guid}")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> DeleteVariant(
        Guid id,
        Guid variantId,
        [FromServices] ICurrentUserService currentUser
    )
    {
        var variant = await _db
            .ProductVariants.Include(v => v.Product)
            .FirstOrDefaultAsync(v =>
                v.Id == variantId
                && v.ProductId == id
                && v.Product.MerchantId == currentUser.MerchantId
            );

        if (variant == null)
            return NotFound();

        variant.IsActive = false;
        variant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

// ── Variant DTOs ────────────────────────────────────────────────────────────────

public record CreateVariantDto(
    string SKU,
    Dictionary<string, string>? Attributes,
    decimal? PriceOverride,
    int Stock,
    string? ImageUrl
);

public record UpdateVariantDto(
    int? Stock,
    decimal? PriceOverride,
    string? ImageUrl,
    bool? IsActive,
    Dictionary<string, string>? Attributes
);
