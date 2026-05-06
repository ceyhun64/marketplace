namespace api.Domain.Entities;

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductId { get; set; }
    public Guid CustomerId { get; set; }

    public int Rating { get; set; } // 1–5
    public string? Title { get; set; }
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Product Product { get; set; } = null!;
    public User Customer { get; set; } = null!;
}
