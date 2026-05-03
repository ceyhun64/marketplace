namespace api.Domain.Entities;

/// <summary>
/// Müşterinin istediği ürünleri kaydettiği liste.
/// Customer ↔ Product N:M ilişkisi.
/// </summary>
public class WishlistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Guid ProductId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Customer { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
