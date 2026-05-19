namespace api.Domain.Entities;

/// <summary>
/// Single-row configuration for the site's main hero / landing section.
/// Always seeded with Id = 1. Admin can update fields but cannot delete the record.
/// Tags are stored as a JSONB string array for flexibility.
/// </summary>
public class HeroSettings
{
    /// <summary>Always 1 — enforced by unique index and seeder.</summary>
    public int Id { get; set; } = 1;

    // ── Badge pill ──────────────────────────────────────────────────────────
    public string BadgeText { get; set; } = "Next-Gen Commerce";

    // ── Headline ────────────────────────────────────────────────────────────
    /// <summary>Main display headline. Use \n to split across lines.</summary>
    public string Headline { get; set; } = "Premium Marketplace\nMeets Fast Delivery.";
    /// <summary>
    /// Optional word(s) from the headline that receive the accent colour treatment.
    /// The frontend applies an italic + accent-colour style to this substring.
    /// Leave null to use the default ("Marketplace").
    /// </summary>
    public string? HeadlineAccent { get; set; }

    // ── Body copy ───────────────────────────────────────────────────────────
    public string Subtitle { get; set; } =
        "We redefine digital commerce with independent stores and an integrated courier engine — everything under one roof.";

    // ── Search bar ──────────────────────────────────────────────────────────
    public string SearchPlaceholder { get; set; } = "Search products, stores...";

    // ── CTAs ────────────────────────────────────────────────────────────────
    public string PrimaryCtaText  { get; set; } = "Search";
    public string PrimaryCtaHref  { get; set; } = "/products";
    public string? SecondaryCtaText { get; set; }
    public string? SecondaryCtaHref { get; set; }

    // ── Visual ──────────────────────────────────────────────────────────────
    public string? BackgroundImageUrl { get; set; }
    /// <summary>Quick-filter / trending-topic pill labels shown below the search bar.</summary>
    public List<string> Tags { get; set; } = ["Electronics", "Fashion", "Home & Living", "Fast Delivery"];

    // ── Meta ────────────────────────────────────────────────────────────────
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
