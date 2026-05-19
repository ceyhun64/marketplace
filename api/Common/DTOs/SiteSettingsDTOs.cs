namespace api.Common.DTOs;

// ── Announcement ─────────────────────────────────────────────────────────────

public class AnnouncementDto
{
    public Guid   Id              { get; set; }
    public string Text            { get; set; } = string.Empty;
    public string? CtaText        { get; set; }
    public string? CtaUrl         { get; set; }
    public string BackgroundColor { get; set; } = "#1e1e1e";
    public string TextColor       { get; set; } = "rgba(255,255,255,0.85)";
    public bool   IsActive        { get; set; }
    public int    SortOrder       { get; set; }
    public DateTime CreatedAt     { get; set; }
    public DateTime UpdatedAt     { get; set; }
}

public class UpsertAnnouncementDto
{
    public string  Text            { get; set; } = string.Empty;
    public string? CtaText         { get; set; }
    public string? CtaUrl          { get; set; }
    public string  BackgroundColor { get; set; } = "#1e1e1e";
    public string  TextColor       { get; set; } = "rgba(255,255,255,0.85)";
    public bool    IsActive        { get; set; } = true;
    public int     SortOrder       { get; set; }
}

// ── Hero Settings ─────────────────────────────────────────────────────────────

public class HeroSettingsDto
{
    public string  BadgeText          { get; set; } = string.Empty;
    public string  Headline           { get; set; } = string.Empty;
    public string? HeadlineAccent     { get; set; }
    public string  Subtitle           { get; set; } = string.Empty;
    public string  SearchPlaceholder  { get; set; } = string.Empty;
    public string  PrimaryCtaText     { get; set; } = string.Empty;
    public string  PrimaryCtaHref     { get; set; } = string.Empty;
    public string? SecondaryCtaText   { get; set; }
    public string? SecondaryCtaHref   { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public List<string> Tags          { get; set; } = new();
    public bool    IsActive           { get; set; }
    public DateTime UpdatedAt         { get; set; }
}

public class UpdateHeroSettingsDto
{
    public string  BadgeText          { get; set; } = string.Empty;
    public string  Headline           { get; set; } = string.Empty;
    public string? HeadlineAccent     { get; set; }
    public string  Subtitle           { get; set; } = string.Empty;
    public string  SearchPlaceholder  { get; set; } = string.Empty;
    public string  PrimaryCtaText     { get; set; } = string.Empty;
    public string  PrimaryCtaHref     { get; set; } = string.Empty;
    public string? SecondaryCtaText   { get; set; }
    public string? SecondaryCtaHref   { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public List<string> Tags          { get; set; } = new();
    public bool    IsActive           { get; set; } = true;
}
