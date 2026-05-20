namespace api.Domain.Entities;

public class MerchantProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? CustomDomain { get; set; }
    public bool DomainVerified { get; set; } = false;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; } = "TR";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int HandlingHours { get; set; } = 24;
    public bool IsActive { get; set; } = true;
    public bool IsSuspended { get; set; } = false;

    // ── Stripe Connect ──────────────────────────────────────────────────────
    /// <summary>Stripe Express connected account ID, e.g. "acct_1MoKgHJhXxxx"</summary>
    public string? StripeAccountId { get; set; }
    public bool StripeOnboardingComplete { get; set; } = false;
    public DateTime? StripeOnboardedAt { get; set; }

    // ── Product moderation ──────────────────────────────────────────────────
    /// <summary>KVKK/GDPR: date the merchant accepted the terms.</summary>
    public DateTime? TermsAcceptedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Subscription? Subscription { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
