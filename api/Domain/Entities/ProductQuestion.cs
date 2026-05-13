namespace api.Domain.Entities;

public class ProductQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid CustomerId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public Guid? AnsweredByMerchantId { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Product Product { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public MerchantProfile? AnsweredByMerchant { get; set; }
}
