using api.Common.DTOs;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Admin-only CRUD for the announcement bar and hero section.
/// All routes require the AdminOnly policy.
/// </summary>
[ApiController]
[Route("api/admin/site-settings")]
[Authorize(Policy = "AdminOnly")]
public class AdminSiteSettingsController(AppDbContext db) : ControllerBase
{
    // ═══════════════════════════════════════════════════════════════════════
    // ANNOUNCEMENTS
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>GET  /api/admin/site-settings/announcements — All rows (inc. inactive)</summary>
    [HttpGet("announcements")]
    public async Task<IActionResult> GetAllAnnouncements()
    {
        var items = await db.Announcements
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.CreatedAt)
            .Select(a => new AnnouncementDto
            {
                Id              = a.Id,
                Text            = a.Text,
                CtaText         = a.CtaText,
                CtaUrl          = a.CtaUrl,
                BackgroundColor = a.BackgroundColor,
                TextColor       = a.TextColor,
                IsActive        = a.IsActive,
                SortOrder       = a.SortOrder,
                CreatedAt       = a.CreatedAt,
                UpdatedAt       = a.UpdatedAt,
            })
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>POST /api/admin/site-settings/announcements — Create new announcement</summary>
    [HttpPost("announcements")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] UpsertAnnouncementDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest(new { message = "Text is required." });

        var item = new AnnouncementItem
        {
            Id              = Guid.NewGuid(),
            Text            = dto.Text.Trim(),
            CtaText         = dto.CtaText?.Trim(),
            CtaUrl          = dto.CtaUrl?.Trim(),
            BackgroundColor = dto.BackgroundColor,
            TextColor       = dto.TextColor,
            IsActive        = dto.IsActive,
            SortOrder       = dto.SortOrder,
            CreatedAt       = DateTime.UtcNow,
            UpdatedAt       = DateTime.UtcNow,
        };

        db.Announcements.Add(item);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAllAnnouncements), new { id = item.Id },
            MapToDto(item));
    }

    /// <summary>PUT  /api/admin/site-settings/announcements/{id} — Full update</summary>
    [HttpPut("announcements/{id:guid}")]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpsertAnnouncementDto dto)
    {
        var item = await db.Announcements.FindAsync(id);
        if (item is null) return NotFound(new { message = "Announcement not found." });

        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest(new { message = "Text is required." });

        item.Text            = dto.Text.Trim();
        item.CtaText         = dto.CtaText?.Trim();
        item.CtaUrl          = dto.CtaUrl?.Trim();
        item.BackgroundColor = dto.BackgroundColor;
        item.TextColor       = dto.TextColor;
        item.IsActive        = dto.IsActive;
        item.SortOrder       = dto.SortOrder;
        item.UpdatedAt       = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(item));
    }

    /// <summary>PATCH /api/admin/site-settings/announcements/{id}/toggle — Flip active flag</summary>
    [HttpPatch("announcements/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleAnnouncement(Guid id)
    {
        var item = await db.Announcements.FindAsync(id);
        if (item is null) return NotFound(new { message = "Announcement not found." });

        item.IsActive  = !item.IsActive;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { id = item.Id, isActive = item.IsActive });
    }

    /// <summary>DELETE /api/admin/site-settings/announcements/{id}</summary>
    [HttpDelete("announcements/{id:guid}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        var item = await db.Announcements.FindAsync(id);
        if (item is null) return NotFound(new { message = "Announcement not found." });

        db.Announcements.Remove(item);
        await db.SaveChangesAsync();
        return Ok(new { message = "Announcement deleted." });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HERO SETTINGS
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>GET  /api/admin/site-settings/hero</summary>
    [HttpGet("hero")]
    public async Task<IActionResult> GetHero()
    {
        var h = await db.HeroSettings.FindAsync(1);
        if (h is null) return NotFound(new { message = "Hero settings not found." });
        return Ok(MapHeroToDto(h));
    }

    /// <summary>PUT  /api/admin/site-settings/hero — Upsert (always row Id=1)</summary>
    [HttpPut("hero")]
    public async Task<IActionResult> UpdateHero([FromBody] UpdateHeroSettingsDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Headline))
            return BadRequest(new { message = "Headline is required." });

        var h = await db.HeroSettings.FindAsync(1);

        if (h is null)
        {
            // Should never happen after seeding, but safeguard against manual DB wipes
            h = new HeroSettings { Id = 1 };
            db.HeroSettings.Add(h);
        }

        h.BadgeText          = dto.BadgeText.Trim();
        h.Headline           = dto.Headline.Trim();
        h.HeadlineAccent     = dto.HeadlineAccent?.Trim();
        h.Subtitle           = dto.Subtitle.Trim();
        h.SearchPlaceholder  = dto.SearchPlaceholder.Trim();
        h.PrimaryCtaText     = dto.PrimaryCtaText.Trim();
        h.PrimaryCtaHref     = dto.PrimaryCtaHref.Trim();
        h.SecondaryCtaText   = dto.SecondaryCtaText?.Trim();
        h.SecondaryCtaHref   = dto.SecondaryCtaHref?.Trim();
        h.BackgroundImageUrl = dto.BackgroundImageUrl?.Trim();
        h.Tags               = dto.Tags ?? [];
        h.IsActive           = dto.IsActive;
        h.UpdatedAt          = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapHeroToDto(h));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static AnnouncementDto MapToDto(AnnouncementItem a) => new()
    {
        Id              = a.Id,
        Text            = a.Text,
        CtaText         = a.CtaText,
        CtaUrl          = a.CtaUrl,
        BackgroundColor = a.BackgroundColor,
        TextColor       = a.TextColor,
        IsActive        = a.IsActive,
        SortOrder       = a.SortOrder,
        CreatedAt       = a.CreatedAt,
        UpdatedAt       = a.UpdatedAt,
    };

    private static HeroSettingsDto MapHeroToDto(HeroSettings h) => new()
    {
        BadgeText          = h.BadgeText,
        Headline           = h.Headline,
        HeadlineAccent     = h.HeadlineAccent,
        Subtitle           = h.Subtitle,
        SearchPlaceholder  = h.SearchPlaceholder,
        PrimaryCtaText     = h.PrimaryCtaText,
        PrimaryCtaHref     = h.PrimaryCtaHref,
        SecondaryCtaText   = h.SecondaryCtaText,
        SecondaryCtaHref   = h.SecondaryCtaHref,
        BackgroundImageUrl = h.BackgroundImageUrl,
        Tags               = h.Tags,
        IsActive           = h.IsActive,
        UpdatedAt          = h.UpdatedAt,
    };
}
