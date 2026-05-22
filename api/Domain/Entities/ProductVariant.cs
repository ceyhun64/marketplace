namespace api.Domain.Entities;

/// <summary>
/// A specific combination of product attributes (e.g. Size=L + Color=Red).
/// Each variant owns its own SKU, stock count, and optional price override.
/// Stored attributes use JSONB for flexible schema-free attribute sets.
/// </summary>
public class ProductVariant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }

    /// <summary>Unique stock-keeping unit within the merchant's catalogue.</summary>
    public string SKU { get; set; } = string.Empty;

    /// <summary>
    /// Attribute key-value pairs (e.g. {"Size":"L","Color":"Red"}).
    /// Stored as JSONB in PostgreSQL.
    /// </summary>
    public Dictionary<string, string> Attributes { get; set; } = new();

    /// <summary>Overrides the base product price. Null means use Product.Price.</summary>
    public decimal? PriceOverride { get; set; }

    /// <summary>Stock specific to this variant combination.</summary>
    public int Stock { get; set; } = 0;

    /// <summary>Optional variant-specific image (e.g. red colourway photo).</summary>
    public string? ImageUrl { get; set; }

    // ── Physical Dimensions (override base product dimensions when set) ─────────
    /// <summary>Variant-specific gross weight in kg. Falls back to Product.WeightKg when null.</summary>
    public decimal? WeightKg { get; set; }

    /// <summary>Variant-specific width in cm.</summary>
    public decimal? WidthCm { get; set; }

    /// <summary>Variant-specific height in cm.</summary>
    public decimal? HeightCm { get; set; }

    /// <summary>Variant-specific length in cm.</summary>
    public decimal? LengthCm { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ─────────────────────────────────────────────────────────────
    public Product Product { get; set; } = null!;
}
