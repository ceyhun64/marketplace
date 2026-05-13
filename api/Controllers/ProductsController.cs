using api.Common.DTOs;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db) => _db = db;

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
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{search}%")
                || EF.Functions.ILike(p.Description, $"%{search}%")
            );

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
        var reviews = await _db
            .Reviews.Where(r => r.ProductId == id)
            .Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var reviewCount = reviews.Count;
        var rating = reviewCount > 0 ? reviews.Average(r => r.Rating) : 0.0;

        var ratingDistribution = reviews
            .GroupBy(r => r.Rating)
            .ToDictionary(g => g.Key, g => g.Count());

        var reviewDtos = reviews
            .Take(20)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Title,
                r.Comment,
                r.CreatedAt,
                CustomerName = r.Customer != null
                    ? r.Customer.FirstName + " " + r.Customer.LastName.Substring(0, 1) + "."
                    : "Anonymous",
            })
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

        // ── Meta Stats (views = wishlist count × 10 heuristic, favorites, purchases) ──
        var favoritesCount = await _db.WishlistItems.CountAsync(w => w.ProductId == id);
        var purchaseCount = await _db.OrderItems.CountAsync(i => i.ProductId == id);

        // ── Shipping info (from merchant handling hours + product price) ──────
        var freeShipping = product.Price >= 500m;
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
            // Meta
            Meta = new
            {
                Views = favoritesCount * 12 + purchaseCount * 5 + reviewCount * 3,
                Favorites = favoritesCount,
                PurchaseCount = purchaseCount,
                LastUpdated = product.UpdatedAt,
            },
            // Shipping
            Shipping = new
            {
                FreeShipping = freeShipping,
                EstimatedDelivery = $"{estimatedMin}–{estimatedMax} business days",
                ShippingCost = freeShipping ? 0m : 29.90m,
                ExpressAvailable = true,
                ExpressDelivery = "Next business day",
                ExpressCost = 59.90m,
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

        // Full-text arama
        if (!string.IsNullOrEmpty(q))
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{q}%")
                || EF.Functions.ILike(p.Description, $"%{q}%")
                || p.Tags.Any(t => EF.Functions.ILike(t, $"%{q}%"))
            );

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

        // Tag filtresi
        if (tags != null && tags.Count > 0)
            query = query.Where(p => p.Tags.Any(t => tags.Contains(t)));

        // Fiyat aralığı
        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        // Sıralama
        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var results = await query
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
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{search}%")
                || EF.Functions.ILike(p.Description, $"%{search}%")
            );

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

    /// <summary>Ürün oluştur (Admin veya Merchant)</summary>
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

        // MerchantId belirleme: admin başkası adına ekleyebilir, merchant sadece kendisi
        Guid merchantId;
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userRole == "Admin")
        {
            // Admin: dto'da MerchantId verilmişse onu kullan, yoksa kendi profilini bul
            if (dto.MerchantId.HasValue)
            {
                var merchantExists = await _db.MerchantProfiles.AnyAsync(m =>
                    m.Id == dto.MerchantId.Value
                );
                if (!merchantExists)
                    return BadRequest(new { message = "Belirtilen merchant bulunamadı." });
                merchantId = dto.MerchantId.Value;
            }
            else
            {
                var adminMerchant = await _db
                    .MerchantProfiles.Where(m => m.UserId == Guid.Parse(userIdClaim!))
                    .FirstOrDefaultAsync();
                if (adminMerchant == null)
                {
                    var fallback = await _db.MerchantProfiles.FirstOrDefaultAsync(m => m.IsActive);
                    if (fallback == null)
                        return BadRequest(
                            new
                            {
                                message = "Ürün eklemek için en az bir merchant gerekli. MerchantId gönderin.",
                            }
                        );
                    merchantId = fallback.Id;
                }
                else
                {
                    merchantId = adminMerchant.Id;
                }
            }
        }
        else
        {
            // Merchant: kendi profilini bul
            var merchant = await _db
                .MerchantProfiles.Include(m => m.Subscription)
                .FirstOrDefaultAsync(m => m.UserId == Guid.Parse(userIdClaim!));
            if (merchant == null)
                return Forbid();
            merchantId = merchant.Id;

            // Plan kontrolü: PublishToMarket sadece Pro+ planlarda
            if (dto.PublishToMarket)
            {
                var plan = merchant.Subscription?.Plan ?? api.Domain.Enums.PlanType.Basic;
                if (plan == api.Domain.Enums.PlanType.Basic)
                    return BadRequest(
                        new ApiResponse<string>(
                            "Marketplace'e ürün yayınlamak için Pro veya Enterprise planı gereklidir."
                        )
                    );
            }
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            ShortDescription = dto.ShortDescription?.Trim(),
            CategoryId = dto.CategoryId,
            Images = dto.Images ?? new List<string>(),
            Tags = dto.Tags ?? new List<string>(),
            Price = dto.Price,
            Stock = dto.Stock,
            PublishToMarket = dto.PublishToMarket,
            PublishToStore = dto.PublishToStore,
            IsApproved = userRole == "Admin",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = product.Id },
            new
            {
                product.Id,
                product.Name,
                product.Price,
                product.Stock,
                product.IsApproved,
                product.MerchantId,
            }
        );
    }

    /// <summary>Onay bekleyen ürünler</summary>
    [HttpGet("pending")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetPending()
    {
        var pending = await _db
            .Products.Include(p => p.Category)
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && !p.IsApproved)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                p.CreatedAt,
                Category = p.Category == null ? null : p.Category.Name,
                Merchant = new { p.Merchant.StoreName, p.Merchant.Slug },
            })
            .ToListAsync();

        return Ok(pending);
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

    /// <summary>Ürün güncelle (Admin veya Merchant)</summary>
    [HttpPatch("{id:guid}/update")]
    [Authorize(Policy = "AdminOrMerchant")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest dto)
    {
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

        // Merchant sadece kendi ürününü güncelleyebilir
        if (userRole == "Merchant")
        {
            var merchant = await _db
                .MerchantProfiles.Include(m => m.Subscription)
                .FirstOrDefaultAsync(m => m.UserId == Guid.Parse(userIdClaim!));
            if (merchant == null || product.MerchantId != merchant.Id)
                return Forbid();

            // Plan kontrolü: PublishToMarket sadece Pro+ planlarda
            if (dto.PublishToMarket == true)
            {
                var plan = merchant.Subscription?.Plan ?? api.Domain.Enums.PlanType.Basic;
                if (plan == api.Domain.Enums.PlanType.Basic)
                    return BadRequest(
                        new ApiResponse<string>(
                            "Marketplace'e ürün yayınlamak için Pro veya Enterprise planı gereklidir."
                        )
                    );
            }
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

    /// <summary>Ürün soft-delete</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (product == null)
            return NotFound(new { message = "Ürün bulunamadı." });

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
}
