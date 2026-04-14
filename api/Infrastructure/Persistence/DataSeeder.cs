using api.Domain.Entities;
using api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // ── SuperAdmin ────────────────────────────────────────────────────────
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            db.Users.Add(
                new User
                {
                    Id = Guid.NewGuid(),
                    Email = "admin@marketplace.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = UserRole.Admin,
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow,
                }
            );
        }

        // ── Root Categories ───────────────────────────────────────────────────
        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Elektronik",
                    Slug = "elektronik",
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Giyim",
                    Slug = "giyim",
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Ev & Yaşam",
                    Slug = "ev-yasam",
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Spor",
                    Slug = "spor",
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Kitap",
                    Slug = "kitap",
                }
            );
        }

        await db.SaveChangesAsync();
    }
}
