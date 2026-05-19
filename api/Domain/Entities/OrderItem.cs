namespace api.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public Guid MerchantId { get; set; }

    /// <summary>FK to the merchant-scoped sub-order (null for orders predating the split architecture).</summary>
    public Guid? VendorOrderId { get; set; }

    /// <summary>FK to the specific product variant chosen (null = base product, no variants).</summary>
    public Guid? VariantId { get; set; }

    public string ProductName { get; set; } = string.Empty;   // snapshot
    public string? ProductImage { get; set; }                  // snapshot
    public decimal UnitPrice { get; set; }                     // snapshot (variant price override applied)
    public int Quantity { get; set; }
    public decimal LineTotal => UnitPrice * Quantity;

    /// <summary>Snapshot of variant attributes at time of purchase (e.g. {"Size":"L","Color":"Red"}).</summary>
    public Dictionary<string, string>? VariantAttributes { get; set; }

    // ── Navigation ─────────────────────────────────────────────────────────────
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public VendorOrder? VendorOrder { get; set; }
    public ProductVariant? Variant { get; set; }
}
