using api.Domain.Entities;
using api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // ── 1. Admin ──────────────────────────────────────────────────────────
        User? admin;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@marketplace.com",
                FirstName = "Platform",
                LastName = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
        }
        else
        {
            admin = await db.Users.FirstAsync(u => u.Role == UserRole.Admin);
        }

        // ── 2. Kategoriler ────────────────────────────────────────────────────
        if (!await db.Categories.AnyAsync())
        {
            var elektronik = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Elektronik",
                Slug = "elektronik",
            };
            var giyim = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Giyim",
                Slug = "giyim",
            };
            var evYasam = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Ev & Yaşam",
                Slug = "ev-yasam",
            };
            var spor = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Spor",
                Slug = "spor",
            };
            var kitap = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Kitap",
                Slug = "kitap",
            };

            db.Categories.AddRange(
                elektronik,
                giyim,
                evYasam,
                spor,
                kitap,
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Telefon",
                    Slug = "telefon",
                    ParentId = elektronik.Id,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Laptop",
                    Slug = "laptop",
                    ParentId = elektronik.Id,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Erkek Giyim",
                    Slug = "erkek-giyim",
                    ParentId = giyim.Id,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Kadın Giyim",
                    Slug = "kadin-giyim",
                    ParentId = giyim.Id,
                }
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 9 kategori oluşturuldu.");
        }

        // ── 3. Merchant Kullanıcılar ──────────────────────────────────────────
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Merchant))
        {
            var m1User = new User
            {
                Id = Guid.NewGuid(),
                Email = "merchant1@marketplace.com",
                FirstName = "Tech",
                LastName = "Merchant",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Merchant123!"),
                Role = UserRole.Merchant,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var m2User = new User
            {
                Id = Guid.NewGuid(),
                Email = "merchant2@marketplace.com",
                FirstName = "Moda",
                LastName = "Merchant",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Merchant123!"),
                Role = UserRole.Merchant,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            db.Users.AddRange(m1User, m2User);
            await db.SaveChangesAsync();

            db.MerchantProfiles.AddRange(
                new MerchantProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = m1User.Id,
                    StoreName = "TechStore Türkiye",
                    Slug = "techstore-turkiye",
                    HandlingHours = 24,
                    Latitude = 41.0082,
                    Longitude = 28.9784,
                },
                new MerchantProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = m2User.Id,
                    StoreName = "Moda Dünyası",
                    Slug = "moda-dunyasi",
                    HandlingHours = 48,
                    Latitude = 39.9334,
                    Longitude = 32.8597,
                }
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 2 merchant oluşturuldu.");
        }

        // ── 4. Ürünler ────────────────────────────────────────────────────────
        if (!await db.Products.AnyAsync())
        {
            var telefonCat = await db.Categories.FirstAsync(c => c.Slug == "telefon");
            var laptopCat = await db.Categories.FirstAsync(c => c.Slug == "laptop");
            var giyimCat = await db.Categories.FirstAsync(c => c.Slug == "giyim");
            var sporCat = await db.Categories.FirstAsync(c => c.Slug == "spor");
            var kitapCat = await db.Categories.FirstAsync(c => c.Slug == "kitap");
            var evCat = await db.Categories.FirstAsync(c => c.Slug == "ev-yasam");

            var techMerchant = await db.MerchantProfiles.FirstAsync(m =>
                m.Slug == "techstore-turkiye"
            );
            var modaMerchant = await db.MerchantProfiles.FirstAsync(m => m.Slug == "moda-dunyasi");

            db.Products.AddRange(
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = techMerchant.Id,
                    Name = "Samsung Galaxy S24",
                    CategoryId = telefonCat.Id,
                    Description = "6.2 inç Dynamic AMOLED, Snapdragon 8 Gen 3, 50MP kamera.",
                    Images = ["https://placehold.co/400x400?text=Galaxy+S24"],
                    Tags = ["samsung", "android", "5g"],
                    Price = 44999m,
                    Stock = 15,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = techMerchant.Id,
                    Name = "Apple iPhone 16 Pro",
                    CategoryId = telefonCat.Id,
                    Description = "6.1 inç Super Retina XDR, A18 Pro chip, 48MP kamera.",
                    Images = ["https://placehold.co/400x400?text=iPhone+16+Pro"],
                    Tags = ["apple", "ios", "5g"],
                    Price = 54999m,
                    Stock = 8,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = techMerchant.Id,
                    Name = "MacBook Air M3",
                    CategoryId = laptopCat.Id,
                    Description = "13.6 inç Liquid Retina, Apple M3, 16GB RAM, 512GB SSD.",
                    Images = ["https://placehold.co/400x400?text=MacBook+Air+M3"],
                    Tags = ["apple", "laptop", "m3"],
                    Price = 67999m,
                    Stock = 5,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = techMerchant.Id,
                    Name = "Lenovo ThinkPad X1 Carbon",
                    CategoryId = laptopCat.Id,
                    Description = "14 inç IPS, Intel Core Ultra 7, 32GB RAM, 1TB SSD.",
                    Images = ["https://placehold.co/400x400?text=ThinkPad+X1"],
                    Tags = ["lenovo", "laptop", "business"],
                    Price = 59999m,
                    Stock = 4,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = modaMerchant.Id,
                    Name = "Nike Air Max 2024",
                    CategoryId = sporCat.Id,
                    Description = "Yüksek konforlu koşu ayakkabısı, Air Max yastıklama.",
                    Images = ["https://placehold.co/400x400?text=Nike+Air+Max"],
                    Tags = ["nike", "kosu", "spor"],
                    Price = 4499m,
                    Stock = 20,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = modaMerchant.Id,
                    Name = "Adidas Ultraboost 24",
                    CategoryId = sporCat.Id,
                    Description = "Responsive Boost ara taban, Primeknit+ kumaş üst.",
                    Images = ["https://placehold.co/400x400?text=Adidas+Ultraboost"],
                    Tags = ["adidas", "kosu", "boost"],
                    Price = 3999m,
                    Stock = 15,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = modaMerchant.Id,
                    Name = "Levi's 501 Original Jean",
                    CategoryId = giyimCat.Id,
                    Description = "Klasik düz kesim erkek kot pantolon, %100 pamuk.",
                    Images = ["https://placehold.co/400x400?text=Levis+501"],
                    Tags = ["levis", "kot", "erkek"],
                    Price = 1299m,
                    Stock = 50,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = modaMerchant.Id,
                    Name = "Atomic Habits - James Clear",
                    CategoryId = kitapCat.Id,
                    Description = "Küçük değişiklikler, büyük sonuçlar. Türkçe çeviri, 320 sayfa.",
                    Images = ["https://placehold.co/400x400?text=Atomic+Habits"],
                    Tags = ["kitap", "kisisel-gelisim", "bestseller"],
                    Price = 189m,
                    Stock = 100,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = modaMerchant.Id,
                    Name = "Philips Airfryer XXL",
                    CategoryId = evCat.Id,
                    Description = "7L kapasiteli dijital airfryer, 7 pişirme modu.",
                    Images = ["https://placehold.co/400x400?text=Philips+Airfryer"],
                    Tags = ["philips", "mutfak", "airfryer"],
                    Price = 3299m,
                    Stock = 10,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    MerchantId = techMerchant.Id,
                    Name = "Dyson V15 Detect",
                    CategoryId = evCat.Id,
                    Description = "Lazer toz tespiti, 60 dk pil, HEPA filtre, kablosuz süpürge.",
                    Images = ["https://placehold.co/400x400?text=Dyson+V15"],
                    Tags = ["dyson", "supurge", "kablosuz"],
                    Price = 18999m,
                    Stock = 7,
                    PublishToMarket = true,
                    PublishToStore = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                }
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 10 ürün oluşturuldu.");
        }

        // ── 5. Demo Kurye ─────────────────────────────────────────────────────
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Courier))
        {
            var courierUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "courier@marketplace.com",
                FirstName = "Demo",
                LastName = "Kurye",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Courier123!"),
                Role = UserRole.Courier,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            db.Users.Add(courierUser);
            await db.SaveChangesAsync();

            db.Couriers.Add(
                new Courier
                {
                    Id = Guid.NewGuid(),
                    UserId = courierUser.Id,
                    IsActive = true,
                }
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ Demo kurye: courier@marketplace.com / Courier123!");
        }

        Console.WriteLine("\n🚀 Seed tamamlandı.");
        Console.WriteLine("   Admin    : admin@marketplace.com     / Admin123!");
        Console.WriteLine("   Merchant1: merchant1@marketplace.com / Merchant123!");
        Console.WriteLine("   Merchant2: merchant2@marketplace.com / Merchant123!");
        Console.WriteLine("   Courier  : courier@marketplace.com   / Courier123!");
    }
}
