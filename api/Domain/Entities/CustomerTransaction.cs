namespace api.Domain.Entities;

public class CustomerTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public string Type { get; set; } = "credit"; // "credit" | "debit"
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;
}
