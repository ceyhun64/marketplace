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
