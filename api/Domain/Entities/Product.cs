using System.ComponentModel.DataAnnotations;
using api.Domain.Enums;
using NpgsqlTypes;

namespace api.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public Guid CategoryId { get; set; }
    public List<string> Images { get; set; } = new();
    public List<string> Tags { get; set; } = new();

    /// <summary>Base price; may be overridden per-variant.</summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Aggregate stock for the base product (no variants).
    /// When variants exist, per-variant stock is canonical; this field is maintained
    /// as a convenience sum for backwards-compatible list queries.
    /// </summary>
    public int Stock { get; set; }

    // ── Physical Dimensions (for volumetric/desi shipping cost calculation) ────
    /// <summary>Gross weight in kilograms.</summary>
    public decimal? WeightKg { get; set; }

    /// <summary>Width in centimetres.</summary>
    public decimal? WidthCm { get; set; }

    /// <summary>Height in centimetres.</summary>
    public decimal? HeightCm { get; set; }

    /// <summary>Length/depth in centimetres.</summary>
    public decimal? LengthCm { get; set; }

    /// <summary>
    /// Volumetric (desi) weight = (W × H × L) / 3000.
    /// Carriers charge whichever is greater: actual weight or desi weight.
    /// Computed property — not stored in DB.
    /// </summary>
    public decimal? VolumetricWeightKg =>
        WidthCm.HasValue && HeightCm.HasValue && LengthCm.HasValue
            ? Math.Round(WidthCm.Value * HeightCm.Value * LengthCm.Value / 3000m, 3)
            : null;

    /// <summary>
    /// Chargeable weight = Max(ActualWeight, VolumetricWeight).
    /// Used by ShippingCalculatorService to determine shipping tier.
    /// </summary>
    public decimal? ChargeableWeightKg =>
        WeightKg.HasValue && VolumetricWeightKg.HasValue
            ? Math.Max(WeightKg.Value, VolumetricWeightKg.Value)
            : WeightKg ?? VolumetricWeightKg;

    public ModerationStatus ModerationStatus { get; set; } = ModerationStatus.PendingReview;

    public bool PublishToMarket { get; set; } = false;
    public bool PublishToStore { get; set; } = true;
    public bool IsApproved { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Full-Text Search ───────────────────────────────────────────────────────
    /// <summary>
    /// PostgreSQL generated tsvector column automatically maintained by the database
    /// from Name + Description.  Backed by a GIN index (configured in AppDbContext).
    /// Never set manually — EF Core maps it as a generated computed column.
    /// </summary>
    public NpgsqlTsVector? SearchVector { get; set; }

    // ── Optimistic Concurrency ─────────────────────────────────────────────────
    /// <summary>
    /// Row-version token for optimistic concurrency on concurrent stock mutations.
    /// EF Core throws <see cref="Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException"/>
    /// when two transactions attempt to update the same row simultaneously, allowing
    /// the caller to retry with refreshed data instead of silently losing an update.
    /// </summary>
    [Timestamp]
    public byte[]? RowVersion { get; set; }

    // ── Navigation ─────────────────────────────────────────────────────────────
    public MerchantProfile Merchant { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}
