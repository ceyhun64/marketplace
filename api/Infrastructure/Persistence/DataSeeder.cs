using api.Domain.Entities;
using api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // ── 1. SuperAdmin ─────────────────────────────────────────────────────
        User? admin = null;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@marketplace.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
            Console.WriteLine("✅ Admin kullanıcı oluşturuldu: admin@marketplace.com / Admin123!");
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

            // Alt kategoriler
            var telefon = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Telefon",
                Slug = "telefon",
                ParentId = elektronik.Id,
            };
            var laptop = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Laptop",
                Slug = "laptop",
                ParentId = elektronik.Id,
            };
            var erkekGiyim = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Erkek Giyim",
                Slug = "erkek-giyim",
                ParentId = giyim.Id,
            };
            var kadinGiyim = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Kadın Giyim",
                Slug = "kadin-giyim",
                ParentId = giyim.Id,
            };

            db.Categories.AddRange(
                elektronik,
                giyim,
                evYasam,
                spor,
                kitap,
                telefon,
                laptop,
                erkekGiyim,
                kadinGiyim
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 9 kategori oluşturuldu.");
        }

        // ── 3. Merchant Kullanıcılar ──────────────────────────────────────────
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Merchant))
        {
            // Merchant 1
            var merchant1User = new User
            {
                Id = Guid.NewGuid(),
                Email = "merchant1@marketplace.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Merchant123!"),
                Role = UserRole.Merchant,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
            };

            // Merchant 2
            var merchant2User = new User
            {
                Id = Guid.NewGuid(),
                Email = "merchant2@marketplace.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Merchant123!"),
                Role = UserRole.Merchant,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
            };

            db.Users.AddRange(merchant1User, merchant2User);
            await db.SaveChangesAsync();

            var merchant1Profile = new MerchantProfile
            {
                Id = Guid.NewGuid(),
                UserId = merchant1User.Id,
                StoreName = "TechStore Türkiye",
                Slug = "techstore-turkiye",
                HandlingHours = 24,
                Latitude = 41.0082,
                Longitude = 28.9784, // İstanbul
            };

            var merchant2Profile = new MerchantProfile
            {
                Id = Guid.NewGuid(),
                UserId = merchant2User.Id,
                StoreName = "Moda Dünyası",
                Slug = "moda-dunyasi",
                HandlingHours = 48,
                Latitude = 39.9334,
                Longitude = 32.8597, // Ankara
            };

            db.MerchantProfiles.AddRange(merchant1Profile, merchant2Profile);
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 2 merchant oluşturuldu.");
            Console.WriteLine("   merchant1@marketplace.com / Merchant123!");
            Console.WriteLine("   merchant2@marketplace.com / Merchant123!");
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

            var products = new List<Product>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Samsung Galaxy S24",
                    Description =
                        "6.2 inç Dynamic AMOLED ekran, Snapdragon 8 Gen 3, 50MP kamera sistemi.",
                    CategoryId = telefonCat.Id,
                    Images = ["https://placehold.co/400x400?text=Galaxy+S24"],
                    Tags = ["samsung", "android", "5g"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Apple iPhone 16 Pro",
                    Description = "6.1 inç Super Retina XDR, A18 Pro chip, 48MP kamera.",
                    CategoryId = telefonCat.Id,
                    Images = ["https://placehold.co/400x400?text=iPhone+16+Pro"],
                    Tags = ["apple", "ios", "5g"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "MacBook Air M3",
                    Description = "13.6 inç Liquid Retina, Apple M3 chip, 16GB RAM, 512GB SSD.",
                    CategoryId = laptopCat.Id,
                    Images = ["https://placehold.co/400x400?text=MacBook+Air+M3"],
                    Tags = ["apple", "laptop", "m3"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Lenovo ThinkPad X1 Carbon",
                    Description = "14 inç IPS Anti-glare, Intel Core Ultra 7, 32GB RAM, 1TB SSD.",
                    CategoryId = laptopCat.Id,
                    Images = ["https://placehold.co/400x400?text=ThinkPad+X1"],
                    Tags = ["lenovo", "laptop", "business"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Nike Air Max 2024",
                    Description =
                        "Yüksek konforlu koşu ayakkabısı, Air Max yastıklama teknolojisi.",
                    CategoryId = sporCat.Id,
                    Images = ["https://placehold.co/400x400?text=Nike+Air+Max"],
                    Tags = ["nike", "kosu", "spor"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Adidas Ultraboost 24",
                    Description =
                        "Responsive Boost ara taban, Primeknit+ kumaş üst, erkek koşu ayakkabısı.",
                    CategoryId = sporCat.Id,
                    Images = ["https://placehold.co/400x400?text=Adidas+Ultraboost"],
                    Tags = ["adidas", "kosu", "boost"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Levi's 501 Original Jean",
                    Description = "Klasik düz kesim erkek kot pantolon, %100 pamuk.",
                    CategoryId = giyimCat.Id,
                    Images = ["https://placehold.co/400x400?text=Levis+501"],
                    Tags = ["levis", "kot", "erkek"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Atomic Habits - James Clear",
                    Description = "Küçük değişiklikler, büyük sonuçlar. Türkçe çeviri, 320 sayfa.",
                    CategoryId = kitapCat.Id,
                    Images = ["https://placehold.co/400x400?text=Atomic+Habits"],
                    Tags = ["kitap", "kisisel-gelisim", "bestseller"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Philips Airfryer XXL",
                    Description =
                        "7L kapasiteli dijital airfryer, 7 pişirme modu, sıcak hava teknolojisi.",
                    CategoryId = evCat.Id,
                    Images = ["https://placehold.co/400x400?text=Philips+Airfryer"],
                    Tags = ["philips", "mutfak", "airfryer"],
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    IsApproved = true,
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow,
                    Name = "Dyson V15 Detect",
                    Description =
                        "Lazer toz tespiti, 60 dakika pil ömrü, HEPA filtre, kablosuz süpürge.",
                    CategoryId = evCat.Id,
                    Images = ["https://placehold.co/400x400?text=Dyson+V15"],
                    Tags = ["dyson", "supurge", "kablosuz"],
                },
            };

            db.Products.AddRange(products);
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 10 ürün oluşturuldu.");
        }

        // ── 5. Demo Teklifler ─────────────────────────────────────────────────
        if (!await db.ProductOffers.AnyAsync())
        {
            var merchant1 = await db.MerchantProfiles.FirstOrDefaultAsync(m =>
                m.Slug == "techstore-turkiye"
            );
            var merchant2 = await db.MerchantProfiles.FirstOrDefaultAsync(m =>
                m.Slug == "moda-dunyasi"
            );

            if (merchant1 == null || merchant2 == null)
            {
                Console.WriteLine("⚠️  MerchantProfile bulunamadı, teklif seed'i atlandı.");
                return;
            }

            var galaxy = await db.Products.FirstAsync(p => p.Name.Contains("Galaxy S24"));
            var iphone = await db.Products.FirstAsync(p => p.Name.Contains("iPhone"));
            var macbook = await db.Products.FirstAsync(p => p.Name.Contains("MacBook"));
            var levis = await db.Products.FirstAsync(p => p.Name.Contains("Levi"));
            var nike = await db.Products.FirstAsync(p => p.Name.Contains("Nike"));

            db.ProductOffers.AddRange(
                // TechStore — elektronik teklifleri
                new ProductOffer
                {
                    Id = Guid.NewGuid(),
                    ProductId = galaxy.Id,
                    MerchantId = merchant1.Id,
                    Price = 44999m,
                    Stock = 15,
                    IsActive = true,
                    Rating = 4.7,
                    CreatedAt = DateTime.UtcNow,
                },
                new ProductOffer
                {
                    Id = Guid.NewGuid(),
                    ProductId = iphone.Id,
                    MerchantId = merchant1.Id,
                    Price = 54999m,
                    Stock = 8,
                    IsActive = true,
                    Rating = 4.8,
                    CreatedAt = DateTime.UtcNow,
                },
                new ProductOffer
                {
                    Id = Guid.NewGuid(),
                    ProductId = macbook.Id,
                    MerchantId = merchant1.Id,
                    Price = 67999m,
                    Stock = 5,
                    IsActive = true,
                    Rating = 4.9,
                    CreatedAt = DateTime.UtcNow,
                },
                // Moda Dünyası — giyim teklifleri
                new ProductOffer
                {
                    Id = Guid.NewGuid(),
                    ProductId = levis.Id,
                    MerchantId = merchant2.Id,
                    Price = 1299m,
                    Stock = 50,
                    IsActive = true,
                    Rating = 4.5,
                    CreatedAt = DateTime.UtcNow,
                },
                new ProductOffer
                {
                    Id = Guid.NewGuid(),
                    ProductId = nike.Id,
                    MerchantId = merchant2.Id,
                    Price = 4499m,
                    Stock = 20,
                    IsActive = true,
                    Rating = 4.6,
                    CreatedAt = DateTime.UtcNow,
                },
                // Galaxy'e ikinci teklif — Moda Dünyası
                new ProductOffer
                {
                    Id = Guid.NewGuid(),
                    ProductId = galaxy.Id,
                    MerchantId = merchant2.Id,
                    Price = 45499m,
                    Stock = 3,
                    IsActive = true,
                    Rating = 4.3,
                    CreatedAt = DateTime.UtcNow,
                }
            );

            await db.SaveChangesAsync();
            Console.WriteLine("✅ 6 demo teklif oluşturuldu.");
        }

        // ── 6. Demo Kurye ─────────────────────────────────────────────────────
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Courier))
        {
            var courierUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "courier@marketplace.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Courier123!"),
                Role = UserRole.Courier,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
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
            Console.WriteLine("✅ Demo kurye oluşturuldu: courier@marketplace.com / Courier123!");
        }

        Console.WriteLine("\n🚀 Seed tamamlandı. Demo giriş bilgileri:");
        Console.WriteLine("   Admin    : admin@marketplace.com    / Admin123!");
        Console.WriteLine("   Merchant1: merchant1@marketplace.com / Merchant123!");
        Console.WriteLine("   Merchant2: merchant2@marketplace.com / Merchant123!");
        Console.WriteLine("   Courier  : courier@marketplace.com   / Courier123!");
    }
}
