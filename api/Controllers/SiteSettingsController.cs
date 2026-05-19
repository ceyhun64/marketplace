using api.Common.DTOs;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Public read-only endpoints consumed by the frontend.
/// No authentication required — results are cached by the client for 5 minutes.
/// </summary>
[ApiController]
[Route("api/site-settings")]
public class SiteSettingsController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Returns active announcements sorted by SortOrder.
    /// Used by AnnouncementBar to populate the rotating strip.
    /// </summary>
    [HttpGet("announcements")]
    [ResponseCache(Duration = 300)] // 5-minute HTTP cache
    public async Task<IActionResult> GetAnnouncements()
    {
        var items = await db.Announcements
            .Where(a => a.IsActive)
            .OrderBy(a => a.SortOrder)
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

    /// <summary>
    /// Returns the current hero section configuration.
    /// Returns 404 only if the row has been deleted (it is seeded on startup).
    /// </summary>
    [HttpGet("hero")]
    [ResponseCache(Duration = 300)]
    public async Task<IActionResult> GetHero()
    {
        var h = await db.HeroSettings.FindAsync(1);
        if (h is null) return NotFound(new { message = "Hero settings not found." });

        return Ok(new HeroSettingsDto
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
        });
    }
}
