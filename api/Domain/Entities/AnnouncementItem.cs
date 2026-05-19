namespace api.Domain.Entities;

/// <summary>
/// A single announcement strip that rotates in the site-wide announcement bar.
/// All CRUD is performed via the Admin portal; the frontend reads only active items.
/// </summary>
public class AnnouncementItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    /// <summary>Main announcement text (HTML-free). CTA link is appended separately.</summary>
    public string Text { get; set; } = string.Empty;
    /// <summary>Optional "Shop now" style label for the clickable CTA.</summary>
    public string? CtaText { get; set; }
    /// <summary>Target URL for the CTA. May be relative (/products) or absolute.</summary>
    public string? CtaUrl { get; set; }
    /// <summary>Background CSS value — defaults to the brand charcoal (#1e1e1e).</summary>
    public string BackgroundColor { get; set; } = "#1e1e1e";
    /// <summary>Foreground CSS value for the main text.</summary>
    public string TextColor { get; set; } = "rgba(255,255,255,0.85)";
    /// <summary>Whether this item appears in the public rotation.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>Lower = appears first in the rotation.</summary>
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
