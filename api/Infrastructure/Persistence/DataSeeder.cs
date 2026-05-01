using api.Domain.Entities;
using api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public static class DataSeeder
{
    private static readonly Random Rng = new(42);

    public static async Task SeedAsync(AppDbContext db)
    {
        // ── 1. Admin ──────────────────────────────────────────────────────────
        User admin;
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
                AccountStatus = AccountStatus.Active,
                IsVerified = true,
                Phone = "+905551110000",
                CreatedAt = DateTime.UtcNow.AddMonths(-12),
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
                Description = "Teknoloji ve elektronik ürünler",
                SortOrder = 1,
            };
            var giyim = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Giyim",
                Slug = "giyim",
                Description = "Moda ve kıyafetler",
                SortOrder = 2,
            };
            var evYasam = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Ev & Yaşam",
                Slug = "ev-yasam",
                Description = "Ev dekorasyon ve yaşam ürünleri",
                SortOrder = 3,
            };
            var spor = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Spor",
                Slug = "spor",
                Description = "Spor ve outdoor ürünleri",
                SortOrder = 4,
            };
            var kitap = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Kitap",
                Slug = "kitap",
                Description = "Kitap, dergi ve yayınlar",
                SortOrder = 5,
            };
            var kozmetik = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Kozmetik",
                Slug = "kozmetik",
                Description = "Güzellik ve kişisel bakım",
                SortOrder = 6,
            };
            var oyuncak = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Oyuncak",
                Slug = "oyuncak",
                Description = "Oyuncak ve hobi ürünleri",
                SortOrder = 7,
            };

            db.Categories.AddRange(
                elektronik,
                giyim,
                evYasam,
                spor,
                kitap,
                kozmetik,
                oyuncak,
                // Alt kategoriler
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Telefon",
                    Slug = "telefon",
                    ParentId = elektronik.Id,
                    SortOrder = 1,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Laptop",
                    Slug = "laptop",
                    ParentId = elektronik.Id,
                    SortOrder = 2,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Tablet",
                    Slug = "tablet",
                    ParentId = elektronik.Id,
                    SortOrder = 3,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Kulaklık",
                    Slug = "kulaklik",
                    ParentId = elektronik.Id,
                    SortOrder = 4,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Akıllı Saat",
                    Slug = "akilli-saat",
                    ParentId = elektronik.Id,
                    SortOrder = 5,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Erkek Giyim",
                    Slug = "erkek-giyim",
                    ParentId = giyim.Id,
                    SortOrder = 1,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Kadın Giyim",
                    Slug = "kadin-giyim",
                    ParentId = giyim.Id,
                    SortOrder = 2,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Çocuk Giyim",
                    Slug = "cocuk-giyim",
                    ParentId = giyim.Id,
                    SortOrder = 3,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Mutfak",
                    Slug = "mutfak",
                    ParentId = evYasam.Id,
                    SortOrder = 1,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Dekorasyon",
                    Slug = "dekorasyon",
                    ParentId = evYasam.Id,
                    SortOrder = 2,
                }
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 17 kategori oluşturuldu.");
        }

        // ── 3. Müşteri Kullanıcılar ───────────────────────────────────────────
        List<User> customers;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Customer))
        {
            var customerData = new[]
            {
                ("ahmet.yilmaz@gmail.com", "Ahmet", "Yılmaz", "+905551234567"),
                ("zeynep.kaya@gmail.com", "Zeynep", "Kaya", "+905552345678"),
                ("mehmet.demir@hotmail.com", "Mehmet", "Demir", "+905553456789"),
                ("fatma.celik@gmail.com", "Fatma", "Çelik", "+905554567890"),
                ("ali.sahin@gmail.com", "Ali", "Şahin", "+905555678901"),
                ("ayse.ozturk@outlook.com", "Ayşe", "Öztürk", "+905556789012"),
                ("mustafa.arslan@gmail.com", "Mustafa", "Arslan", "+905557890123"),
                ("hatice.dogan@gmail.com", "Hatice", "Doğan", "+905558901234"),
                ("ibrahim.yildiz@gmail.com", "İbrahim", "Yıldız", "+905559012345"),
                ("elif.kurt@hotmail.com", "Elif", "Kurt", "+905550123456"),
            };
            customers = new List<User>();
            foreach (var (email, first, last, phone) in customerData)
            {
                var u = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    FirstName = first,
                    LastName = last,
                    Phone = phone,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
                    Role = UserRole.Customer,
                    AccountStatus = AccountStatus.Active,
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow.AddMonths(-Rng.Next(1, 10)),
                    UpdatedAt = DateTime.UtcNow,
                };
                customers.Add(u);
            }
            db.Users.AddRange(customers);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {customers.Count} müşteri oluşturuldu.");
        }
        else
        {
            customers = await db.Users.Where(u => u.Role == UserRole.Customer).ToListAsync();
        }

        // ── 4. Merchant Kullanıcılar & Profiller ──────────────────────────────
        List<MerchantProfile> merchants;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Merchant))
        {
            var merchantData = new[]
            {
                (
                    "merchant1@marketplace.com",
                    "Tech",
                    "Merchant",
                    "TechStore Türkiye",
                    "techstore-turkiye",
                    "İstanbul, Türkiye",
                    "İstanbul",
                    41.0082,
                    28.9784,
                    24,
                    PlanType.Pro
                ),
                (
                    "merchant2@marketplace.com",
                    "Moda",
                    "Merchant",
                    "Moda Dünyası",
                    "moda-dunyasi",
                    "Ankara, Türkiye",
                    "Ankara",
                    39.9334,
                    32.8597,
                    48,
                    PlanType.Basic
                ),
                (
                    "merchant3@marketplace.com",
                    "Ev",
                    "Merchant",
                    "Ev & Dekor",
                    "ev-dekor",
                    "İzmir, Türkiye",
                    "İzmir",
                    38.4192,
                    27.1287,
                    36,
                    PlanType.Pro
                ),
                (
                    "merchant4@marketplace.com",
                    "Spor",
                    "World",
                    "Spor World",
                    "spor-world",
                    "Bursa, Türkiye",
                    "Bursa",
                    40.1826,
                    29.0665,
                    24,
                    PlanType.Enterprise
                ),
                (
                    "merchant5@marketplace.com",
                    "Kitap",
                    "Center",
                    "Kitap Center",
                    "kitap-center",
                    "Antalya, Türkiye",
                    "Antalya",
                    36.8969,
                    30.7133,
                    12,
                    PlanType.Basic
                ),
            };

            merchants = new List<MerchantProfile>();
            foreach (
                var (
                    email,
                    first,
                    last,
                    store,
                    slug,
                    address,
                    city,
                    lat,
                    lon,
                    hours,
                    plan
                ) in merchantData
            )
            {
                var mUser = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    FirstName = first,
                    LastName = last,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Merchant123!"),
                    Role = UserRole.Merchant,
                    AccountStatus = AccountStatus.Active,
                    IsVerified = true,
                    Phone = $"+9055{Rng.Next(10000000, 99999999)}",
                    CreatedAt = DateTime.UtcNow.AddMonths(-Rng.Next(3, 12)),
                    UpdatedAt = DateTime.UtcNow,
                };
                db.Users.Add(mUser);
                await db.SaveChangesAsync();

                var profile = new MerchantProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = mUser.Id,
                    StoreName = store,
                    Slug = slug,
                    Description = $"{store} — Türkiye'nin güvenilir alışveriş noktası.",
                    Address = address,
                    City = city,
                    Country = "TR",
                    Latitude = lat,
                    Longitude = lon,
                    HandlingHours = hours,
                    IsActive = true,
                    CreatedAt = mUser.CreatedAt,
                    UpdatedAt = DateTime.UtcNow,
                };
                db.MerchantProfiles.Add(profile);
                await db.SaveChangesAsync();

                // Abonelik
                var subPrice = plan switch
                {
                    PlanType.Basic => 199m,
                    PlanType.Pro => 499m,
                    _ => 999m,
                };
                db.Subscriptions.Add(
                    new Subscription
                    {
                        Id = Guid.NewGuid(),
                        MerchantId = profile.Id,
                        Plan = plan,
                        MonthlyPrice = subPrice,
                        IsActive = true,
                        StartDate = mUser.CreatedAt,
                        ExpiresAt = DateTime.UtcNow.AddMonths(Rng.Next(1, 6)),
                        PaymentId = $"PAY-SUB-{Guid.NewGuid():N}"[..16],
                        AutoRenew = true,
                        CreatedAt = mUser.CreatedAt,
                        UpdatedAt = DateTime.UtcNow,
                    }
                );
                await db.SaveChangesAsync();
                merchants.Add(profile);
            }
            Console.WriteLine($"✅ {merchants.Count} merchant + abonelik oluşturuldu.");
        }
        else
        {
            merchants = await db.MerchantProfiles.ToListAsync();
        }

        // ── 5. Kuryeler ───────────────────────────────────────────────────────
        List<Courier> couriers;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Courier))
        {
            var courierData = new[]
            {
                (
                    "courier1@marketplace.com",
                    "Kadir",
                    "Polat",
                    "Motorcycle",
                    "34ABC123",
                    41.015,
                    28.979
                ),
                ("courier2@marketplace.com", "Serkan", "Güneş", "Car", "06XYZ456", 39.920, 32.854),
                (
                    "courier3@marketplace.com",
                    "Burak",
                    "Aydın",
                    "Bicycle",
                    "35QWE789",
                    38.430,
                    27.140
                ),
                (
                    "courier4@marketplace.com",
                    "Emre",
                    "Taş",
                    "Motorcycle",
                    "16DEF012",
                    40.195,
                    29.058
                ),
            };
            couriers = new List<Courier>();
            foreach (var (email, first, last, vehicle, plate, lat, lon) in courierData)
            {
                var cUser = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    FirstName = first,
                    LastName = last,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Courier123!"),
                    Role = UserRole.Courier,
                    AccountStatus = AccountStatus.Active,
                    IsVerified = true,
                    Phone = $"+9055{Rng.Next(10000000, 99999999)}",
                    CreatedAt = DateTime.UtcNow.AddMonths(-Rng.Next(1, 6)),
                    UpdatedAt = DateTime.UtcNow,
                };
                db.Users.Add(cUser);
                await db.SaveChangesAsync();

                var courier = new Courier
                {
                    Id = Guid.NewGuid(),
                    UserId = cUser.Id,
                    VehicleType = vehicle,
                    PlateNumber = plate,
                    IsActive = true,
                    IsAvailable = Rng.Next(0, 2) == 1,
                    CurrentLatitude = lat,
                    CurrentLongitude = lon,
                    LastLocationUpdate = DateTime.UtcNow.AddMinutes(-Rng.Next(5, 120)),
                    CreatedAt = cUser.CreatedAt,
                };
                db.Couriers.Add(courier);
                await db.SaveChangesAsync();
                couriers.Add(courier);
            }
            Console.WriteLine($"✅ {couriers.Count} kurye oluşturuldu.");
        }
        else
        {
            couriers = await db.Couriers.ToListAsync();

            // Mevcut courier kullanıcılarının şifresini seed şifresiyle senkronize et
            var courierEmails = new[]
            {
                "courier1@marketplace.com",
                "courier2@marketplace.com",
                "courier3@marketplace.com",
                "courier4@marketplace.com",
            };
            var courierUsers = await db
                .Users.Where(u => u.Role == UserRole.Courier && courierEmails.Contains(u.Email))
                .ToListAsync();
            var expectedHash = BCrypt.Net.BCrypt.HashPassword("Courier123!");
            foreach (var cu in courierUsers)
            {
                if (!BCrypt.Net.BCrypt.Verify("Courier123!", cu.PasswordHash))
                {
                    cu.PasswordHash = expectedHash;
                    cu.AccountStatus = AccountStatus.Active;
                    cu.IsVerified = true;
                    cu.UpdatedAt = DateTime.UtcNow;
                }
            }
            await db.SaveChangesAsync();
        }

        // ── 6. Ürünler ────────────────────────────────────────────────────────
        if (!await db.Products.AnyAsync())
        {
            var telefonCat = await db.Categories.FirstAsync(c => c.Slug == "telefon");
            var laptopCat = await db.Categories.FirstAsync(c => c.Slug == "laptop");
            var tabletCat = await db.Categories.FirstAsync(c => c.Slug == "tablet");
            var kulaklikCat = await db.Categories.FirstAsync(c => c.Slug == "kulaklik");
            var saatCat = await db.Categories.FirstAsync(c => c.Slug == "akilli-saat");
            var erkekGiyim = await db.Categories.FirstAsync(c => c.Slug == "erkek-giyim");
            var kadinGiyim = await db.Categories.FirstAsync(c => c.Slug == "kadin-giyim");
            var mutfakCat = await db.Categories.FirstAsync(c => c.Slug == "mutfak");
            var dekorCat = await db.Categories.FirstAsync(c => c.Slug == "dekorasyon");
            var sporCat = await db.Categories.FirstAsync(c => c.Slug == "spor");
            var kitapCat = await db.Categories.FirstAsync(c => c.Slug == "kitap");

            var techM = merchants.First(m => m.Slug == "techstore-turkiye");
            var modaM = merchants.First(m => m.Slug == "moda-dunyasi");
            var evM = merchants.First(m => m.Slug == "ev-dekor");
            var sporM = merchants.First(m => m.Slug == "spor-world");
            var kitapM = merchants.First(m => m.Slug == "kitap-center");

            var products = new List<Product>
            {
                // TechStore ürünleri
                MakeProduct(
                    techM.Id,
                    telefonCat.Id,
                    "Samsung Galaxy S24",
                    "6.2 inç Dynamic AMOLED, Snapdragon 8 Gen 3, 50MP kamera. Gece fotoğrafçılığında devrim.",
                    44999m,
                    15,
                    ["samsung", "android", "5g"]
                ),
                MakeProduct(
                    techM.Id,
                    telefonCat.Id,
                    "Apple iPhone 16 Pro",
                    "6.1 inç Super Retina XDR, A18 Pro chip, 48MP kamera. Profesyoneller için tasarlandı.",
                    54999m,
                    8,
                    ["apple", "ios", "5g"]
                ),
                MakeProduct(
                    techM.Id,
                    telefonCat.Id,
                    "Xiaomi 14 Ultra",
                    "6.73 inç LTPO AMOLED, Snapdragon 8 Gen 3, 50MP Leica Quad kamera. Fotoğraf tutkunları için.",
                    39999m,
                    12,
                    ["xiaomi", "leica", "android"]
                ),
                MakeProduct(
                    techM.Id,
                    laptopCat.Id,
                    "MacBook Air M3",
                    "13.6 inç Liquid Retina, Apple M3, 16GB RAM, 512GB SSD. Taşınabilirlikte zirve.",
                    67999m,
                    5,
                    ["apple", "laptop", "m3"]
                ),
                MakeProduct(
                    techM.Id,
                    laptopCat.Id,
                    "Lenovo ThinkPad X1 Carbon",
                    "14 inç IPS, Intel Core Ultra 7, 32GB RAM, 1TB SSD. Kurumsal kullanım için ideal.",
                    59999m,
                    4,
                    ["lenovo", "laptop", "business"]
                ),
                MakeProduct(
                    techM.Id,
                    laptopCat.Id,
                    "ASUS ROG Zephyrus G16",
                    "16 inç QHD 240Hz, RTX 4080, Ryzen 9 8945HS. Oyun performansında üst segment.",
                    72999m,
                    3,
                    ["asus", "gaming", "rtx4080"]
                ),
                MakeProduct(
                    techM.Id,
                    tabletCat.Id,
                    "iPad Pro 13 M4",
                    "13 inç Ultra Retina XDR, M4 chip, 256GB. Tanscend-ince tasarım ve sonsuz güç.",
                    49999m,
                    6,
                    ["apple", "ipad", "m4"]
                ),
                MakeProduct(
                    techM.Id,
                    kulaklikCat.Id,
                    "Sony WH-1000XM5",
                    "30 saatlik pil, endüstrinin lideri gürültü engelleme, çok cihaz bağlantısı.",
                    8999m,
                    25,
                    ["sony", "kulaklik", "anc"]
                ),
                MakeProduct(
                    techM.Id,
                    kulaklikCat.Id,
                    "AirPods Pro 2. Nesil",
                    "Adaptif ses önleme, Kişiselleştirilmiş Uzamsal Ses, USB-C şarj kutusu.",
                    7499m,
                    30,
                    ["apple", "airpods", "tws"]
                ),
                MakeProduct(
                    techM.Id,
                    saatCat.Id,
                    "Apple Watch Series 10",
                    "49mm titanyum kasa, çift bant GPS, kan oksijeni, uyku takibi.",
                    14999m,
                    10,
                    ["apple", "watch", "fitness"]
                ),
                MakeProduct(
                    techM.Id,
                    saatCat.Id,
                    "Samsung Galaxy Watch 7",
                    "44mm, BioActive sensör, 40 saat pil, Wear OS. Android ekosistemiyle mükemmel uyum.",
                    9999m,
                    18,
                    ["samsung", "watch", "android"]
                ),
                // Moda Dünyası ürünleri
                MakeProduct(
                    modaM.Id,
                    erkekGiyim.Id,
                    "Levi's 501 Original Jean",
                    "Klasik düz kesim erkek kot pantolon, %100 organik pamuk. Zamansız stil.",
                    1299m,
                    50,
                    ["levis", "kot", "erkek"]
                ),
                MakeProduct(
                    modaM.Id,
                    erkekGiyim.Id,
                    "Tommy Hilfiger Polo",
                    "Slim fit pamuklu polo tişört, küçük logo nakışı. Ofis ve günlük için.",
                    799m,
                    40,
                    ["tommy", "polo", "erkek"]
                ),
                MakeProduct(
                    modaM.Id,
                    kadinGiyim.Id,
                    "Mango Midi Elbise",
                    "Fisto dokuma kumaş, midi boy elbise. Yaz koleksiyonu 2026.",
                    1499m,
                    35,
                    ["mango", "elbise", "yaz"]
                ),
                MakeProduct(
                    modaM.Id,
                    kadinGiyim.Id,
                    "Zara Blazer Ceket",
                    "Fitted blazer ceket, düğmeli yaka. İş hayatında zarafetin simgesi.",
                    2199m,
                    20,
                    ["zara", "blazer", "kadin"]
                ),
                MakeProduct(
                    modaM.Id,
                    sporCat.Id,
                    "Nike Air Max 2024",
                    "Yüksek konforlu koşu ayakkabısı, Air Max yastıklama sistemi. Maksimum konfor.",
                    4499m,
                    20,
                    ["nike", "kosu", "spor"]
                ),
                MakeProduct(
                    modaM.Id,
                    sporCat.Id,
                    "Adidas Ultraboost 24",
                    "Responsive Boost ara taban, Primeknit+ kumaş üst. Koşucunun tercihi.",
                    3999m,
                    15,
                    ["adidas", "kosu", "boost"]
                ),
                // Ev & Dekor ürünleri
                MakeProduct(
                    evM.Id,
                    mutfakCat.Id,
                    "Philips Airfryer XXL",
                    "7L kapasiteli dijital airfryer, 7 pişirme modu, akıllı dokunmatik ekran.",
                    3299m,
                    10,
                    ["philips", "mutfak", "airfryer"]
                ),
                MakeProduct(
                    evM.Id,
                    mutfakCat.Id,
                    "Tefal Grandhall XXL",
                    "2400W barbekü ızgara, 75x32 cm ızgara yüzeyi, katlanabilir tasarım.",
                    2499m,
                    8,
                    ["tefal", "izgara", "bbq"]
                ),
                MakeProduct(
                    evM.Id,
                    mutfakCat.Id,
                    "Nespresso Vertuo Pop",
                    "Barista'dan ilham alan 5 kahve boyutu. Kompakt tasarım, 14 saniyede hazır.",
                    1999m,
                    14,
                    ["nespresso", "kahve", "espresso"]
                ),
                MakeProduct(
                    evM.Id,
                    dekorCat.Id,
                    "Dyson V15 Detect",
                    "Lazer toz tespiti, 60 dk pil, HEPA filtre. Kablosuz süpürgede devrim.",
                    18999m,
                    7,
                    ["dyson", "supurge", "kablosuz"]
                ),
                MakeProduct(
                    evM.Id,
                    dekorCat.Id,
                    "IKEA BILLY Kitaplık",
                    "80x28x202 cm, beyaz renk, ayarlanabilir raflar. Scandi minimalist tasarım.",
                    899m,
                    22,
                    ["ikea", "kitaplik", "dekor"]
                ),
                // Spor World ürünleri
                MakeProduct(
                    sporM.Id,
                    sporCat.Id,
                    "Garmin Forerunner 965",
                    "AMOLED ekran, GPS, kalp ritmi, VO2 max ölçümü. Yarı maraton taktiğinizi optimize edin.",
                    15999m,
                    6,
                    ["garmin", "gps", "kosu"]
                ),
                MakeProduct(
                    sporM.Id,
                    sporCat.Id,
                    "Decathlon Bisiklet 27.5\"",
                    "Dağ bisikleti, 21 vites Shimano, hidrolik disk fren. Off-road maceraya hazır.",
                    6999m,
                    9,
                    ["bisiklet", "mtb", "shimano"]
                ),
                MakeProduct(
                    sporM.Id,
                    sporCat.Id,
                    "Wilson Pro Staff Tenis",
                    "97 inç baş, 315g, 18x20 kordon düzeni. Profesyonel tenis raketi.",
                    4299m,
                    11,
                    ["wilson", "tenis", "pro"]
                ),
                // Kitap Center ürünleri
                MakeProduct(
                    kitapM.Id,
                    kitapCat.Id,
                    "Atomic Habits - James Clear",
                    "Küçük değişiklikler, büyük sonuçlar. Türkçe çeviri, 320 sayfa. Dünyada 15M+ satış.",
                    189m,
                    100,
                    ["kitap", "kisisel-gelisim", "bestseller"]
                ),
                MakeProduct(
                    kitapM.Id,
                    kitapCat.Id,
                    "Sapiens - Yuval Noah Harari",
                    "İnsanlığın kısa tarihi. 500+ sayfa, Türkçe. Fikirlerinizi kökten değiştirecek.",
                    249m,
                    80,
                    ["kitap", "tarih", "harari"]
                ),
                MakeProduct(
                    kitapM.Id,
                    kitapCat.Id,
                    "Dune - Frank Herbert",
                    "Çöl Gezegeni. Bilim kurgunun başyapıtı, Türkçe çeviri 800 sayfa.",
                    219m,
                    60,
                    ["kitap", "sci-fi", "dune"]
                ),
                MakeProduct(
                    kitapM.Id,
                    kitapCat.Id,
                    "Savaş Sanatı - Sun Tzu",
                    "Strateji ve liderlik klasiği. Türkçe, 160 sayfa. Her yöneticinin okuması gereken eser.",
                    149m,
                    120,
                    ["kitap", "strateji", "klasik"]
                ),
            };

            db.Products.AddRange(products);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {products.Count} ürün oluşturuldu.");
        }

        // ── 7. Pluginler ──────────────────────────────────────────────────────
        if (!await db.Plugins.AnyAsync())
        {
            var plugins = new List<Plugin>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "Google Analytics",
                    Slug = "google-analytics",
                    Description =
                        "Mağazanıza Google Analytics entegrasyonu. Ziyaretçi, dönüşüm ve gelir raporlarını anlık takip edin.",
                    Category = "Analytics",
                    MonthlyPrice = 0m,
                    IsActive = true,
                    IsFeatured = true,
                    MinimumPlan = PlanType.Basic,
                    DeveloperName = "Google LLC",
                    DocumentationUrl = "https://analytics.google.com",
                    CreatedAt = DateTime.UtcNow.AddMonths(-8),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "Live Chat",
                    Slug = "live-chat",
                    Description =
                        "Müşterilerinizle gerçek zamanlı sohbet edin. Yapay zeka destekli otomatik yanıtlar dahil.",
                    Category = "Chat",
                    MonthlyPrice = 49.90m,
                    IsActive = true,
                    IsFeatured = true,
                    MinimumPlan = PlanType.Pro,
                    DeveloperName = "LiveChat Inc.",
                    DocumentationUrl = "https://www.livechat.com",
                    CreatedAt = DateTime.UtcNow.AddMonths(-7),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "SEO Optimizer",
                    Slug = "seo-optimizer",
                    Description =
                        "Meta etiketleri, XML sitemap ve yapısal veri otomatik yönetimi. Arama motoru görünürlüğünüzü artırın.",
                    Category = "SEO",
                    MonthlyPrice = 29.90m,
                    IsActive = true,
                    IsFeatured = false,
                    MinimumPlan = PlanType.Pro,
                    DeveloperName = "Marketplace Team",
                    DocumentationUrl = null,
                    CreatedAt = DateTime.UtcNow.AddMonths(-6),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "E-Posta Marketing",
                    Slug = "email-marketing",
                    Description =
                        "Otomatik kampanya gönderimi, segmentasyon ve açılma oranı takibi. Mailchimp ve SendGrid destekli.",
                    Category = "Marketing",
                    MonthlyPrice = 79.90m,
                    IsActive = true,
                    IsFeatured = false,
                    MinimumPlan = PlanType.Pro,
                    DeveloperName = "Marketing Suite",
                    DocumentationUrl = null,
                    CreatedAt = DateTime.UtcNow.AddMonths(-5),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "Muhasebe Entegrasyonu",
                    Slug = "accounting",
                    Description =
                        "Fatura, ödeme ve muhasebe kayıtlarını otomatik senkronize edin. Logo, Mikro ve Paraşüt destekli.",
                    Category = "Accounting",
                    MonthlyPrice = 149.90m,
                    IsActive = true,
                    IsFeatured = false,
                    MinimumPlan = PlanType.Enterprise,
                    DeveloperName = "FinTech Partners",
                    DocumentationUrl = null,
                    CreatedAt = DateTime.UtcNow.AddMonths(-4),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "WhatsApp Bildirim",
                    Slug = "whatsapp-notify",
                    Description =
                        "Sipariş durum güncellemelerini WhatsApp üzerinden müşterilerinize otomatik gönderin.",
                    Category = "Chat",
                    MonthlyPrice = 39.90m,
                    IsActive = true,
                    IsFeatured = true,
                    MinimumPlan = PlanType.Basic,
                    DeveloperName = "NotifyHub",
                    DocumentationUrl = null,
                    CreatedAt = DateTime.UtcNow.AddMonths(-3),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "Facebook Pixel",
                    Slug = "facebook-pixel",
                    Description =
                        "Retargeting kampanyaları için Facebook Pixel entegrasyonu. Dönüşümlerinizi 3x artırın.",
                    Category = "Analytics",
                    MonthlyPrice = 19.90m,
                    IsActive = true,
                    IsFeatured = false,
                    MinimumPlan = PlanType.Basic,
                    DeveloperName = "Meta LLC",
                    DocumentationUrl = "https://developers.facebook.com",
                    CreatedAt = DateTime.UtcNow.AddMonths(-2),
                    UpdatedAt = DateTime.UtcNow,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "İndirim Kuponu",
                    Slug = "coupon-manager",
                    Description =
                        "Esnek kupon ve indirim kodu yönetimi. Yüzde veya sabit indirim, tek/çok kullanım.",
                    Category = "Marketing",
                    MonthlyPrice = 24.90m,
                    IsActive = true,
                    IsFeatured = false,
                    MinimumPlan = PlanType.Pro,
                    DeveloperName = "Marketplace Team",
                    DocumentationUrl = null,
                    CreatedAt = DateTime.UtcNow.AddMonths(-1),
                    UpdatedAt = DateTime.UtcNow,
                },
            };
            db.Plugins.AddRange(plugins);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {plugins.Count} plugin oluşturuldu.");
        }

        // ── 8. MerchantPlugin Abonelikleri ────────────────────────────────────
        if (!await db.MerchantPlugins.AnyAsync())
        {
            var allPlugins = await db.Plugins.ToListAsync();
            var allMerchants = await db.MerchantProfiles.ToListAsync();

            var gaPlugin = allPlugins.FirstOrDefault(p => p.Slug == "google-analytics");
            var chatPlugin = allPlugins.FirstOrDefault(p => p.Slug == "live-chat");
            var seoPlugin = allPlugins.FirstOrDefault(p => p.Slug == "seo-optimizer");
            var emailPlugin = allPlugins.FirstOrDefault(p => p.Slug == "email-marketing");
            var accountPlugin = allPlugins.FirstOrDefault(p => p.Slug == "accounting");
            var whatsPlugin = allPlugins.FirstOrDefault(p => p.Slug == "whatsapp-notify");
            var fbPlugin = allPlugins.FirstOrDefault(p => p.Slug == "facebook-pixel");

            var techM = allMerchants.FirstOrDefault(m => m.Slug == "techstore-turkiye");
            var modaM = allMerchants.FirstOrDefault(m => m.Slug == "moda-dunyasi");
            var sporM = allMerchants.FirstOrDefault(m => m.Slug == "spor-world");

            if (techM == null || modaM == null || sporM == null)
            {
                Console.WriteLine(
                    "⚠️  MerchantPlugin seed atlandı: gerekli merchant profilleri bulunamadı "
                        + $"(techstore={techM != null}, moda={modaM != null}, spor={sporM != null})."
                );
            }
            else if (
                gaPlugin == null
                || chatPlugin == null
                || seoPlugin == null
                || emailPlugin == null
                || accountPlugin == null
                || whatsPlugin == null
                || fbPlugin == null
            )
            {
                Console.WriteLine(
                    "⚠️  MerchantPlugin seed atlandı: gerekli plugin kayıtları bulunamadı."
                );
            }
            else
            {
                db.MerchantPlugins.AddRange(
                    MakeMerchantPlugin(techM.Id, gaPlugin.Id, null, DateTime.UtcNow.AddMonths(2)),
                    MakeMerchantPlugin(
                        techM.Id,
                        chatPlugin.Id,
                        "{\"apiKey\":\"lc_tech_abc123\"}",
                        DateTime.UtcNow.AddMonths(1)
                    ),
                    MakeMerchantPlugin(techM.Id, seoPlugin.Id, null, DateTime.UtcNow.AddMonths(3)),
                    MakeMerchantPlugin(
                        techM.Id,
                        accountPlugin.Id,
                        "{\"provider\":\"Logo\",\"token\":\"xyz\"}",
                        DateTime.UtcNow.AddMonths(2)
                    ),
                    MakeMerchantPlugin(modaM.Id, gaPlugin.Id, null, DateTime.UtcNow.AddMonths(1)),
                    MakeMerchantPlugin(
                        modaM.Id,
                        emailPlugin.Id,
                        "{\"apiKey\":\"mc_moda_key99\"}",
                        DateTime.UtcNow.AddMonths(2)
                    ),
                    MakeMerchantPlugin(
                        modaM.Id,
                        whatsPlugin.Id,
                        "{\"phone\":\"+905551112233\"}",
                        DateTime.UtcNow.AddMonths(1)
                    ),
                    MakeMerchantPlugin(sporM.Id, gaPlugin.Id, null, DateTime.UtcNow.AddMonths(4)),
                    MakeMerchantPlugin(
                        sporM.Id,
                        fbPlugin.Id,
                        "{\"pixelId\":\"1234567890\"}",
                        DateTime.UtcNow.AddMonths(2)
                    )
                );
                await db.SaveChangesAsync();
                Console.WriteLine("✅ 9 merchant plugin aboneliği oluşturuldu.");
            }
        }

        // ── 9. Siparişler, Kargo & Fatura ─────────────────────────────────────
        if (!await db.Orders.AnyAsync())
        {
            var allProducts = await db.Products.ToListAsync();
            var allCustomers = await db.Users.Where(u => u.Role == UserRole.Customer).ToListAsync();
            var allCouriers = await db.Couriers.ToListAsync();

            // (orderStatus, isPaid, shipmentStatus, daysAgo)
            var scenarios = new[]
            {
                (OrderStatus.Delivered, true, ShipmentStatus.Delivered, -30),
                (OrderStatus.Delivered, true, ShipmentStatus.Delivered, -25),
                (OrderStatus.Delivered, true, ShipmentStatus.Delivered, -20),
                (OrderStatus.Delivered, true, ShipmentStatus.Delivered, -18),
                (OrderStatus.Delivered, true, ShipmentStatus.Delivered, -15),
                (OrderStatus.InTransit, true, ShipmentStatus.InTransit, -3),
                (OrderStatus.InTransit, true, ShipmentStatus.InTransit, -2),
                (OrderStatus.OutForDelivery, true, ShipmentStatus.OutForDelivery, -1),
                (OrderStatus.CourierAssigned, true, ShipmentStatus.CourierAssigned, -2),
                (OrderStatus.PickedUp, true, ShipmentStatus.PickedUp, -1),
                (OrderStatus.LabelGenerated, true, ShipmentStatus.LabelGenerated, -1),
                (OrderStatus.PaymentConfirmed, true, ShipmentStatus.Pending, 0),
                (OrderStatus.PaymentConfirmed, true, ShipmentStatus.Pending, 0),
                (OrderStatus.Pending, false, ShipmentStatus.Pending, 0),
                (OrderStatus.Pending, false, ShipmentStatus.Pending, 0),
                (OrderStatus.Cancelled, false, ShipmentStatus.Pending, -5),
                (OrderStatus.Failed, false, ShipmentStatus.Failed, -7),
            };

            var addresses = new[]
            {
                ("Kadıköy", "İstanbul", "Moda Cad. No:12", "34710", 40.991, 29.028),
                ("Çankaya", "Ankara", "Kızılay Sok. No:5", "06540", 39.912, 32.861),
                ("Bornova", "İzmir", "Ege Bulvarı No:88", "35100", 38.458, 27.221),
                ("Nilüfer", "Bursa", "Çekirge Cad. No:3", "16110", 40.212, 28.973),
                ("Muratpaşa", "Antalya", "Cumhuriyet Mah. 7", "07040", 36.887, 30.705),
                ("Şişli", "İstanbul", "Nişantaşı Cad. No:1", "34365", 41.049, 28.991),
                ("Keçiören", "Ankara", "Etlik Sk. No:22", "06380", 39.964, 32.854),
            };

            int invoiceCounter = 1;

            foreach (var (orderStatus, isPaid, shipStatus, daysAgo) in scenarios)
            {
                var customer = allCustomers[Rng.Next(allCustomers.Count)];
                var (district, city, addrLine, postal, dlat, dlon) = addresses[
                    Rng.Next(addresses.Length)
                ];

                // 1-3 ürün seç
                var itemCount = Rng.Next(1, 4);
                var pickedProducts = allProducts.OrderBy(_ => Rng.Next()).Take(itemCount).ToList();

                var createdAt = DateTime.UtcNow.AddDays(daysAgo).AddHours(-Rng.Next(0, 18));
                var shippingAmount = Rng.Next(0, 2) == 0 ? 0m : 49.90m;
                var subTotal = pickedProducts.Sum(p => p.Price);
                var totalAmount = subTotal + shippingAmount;
                var shippingRate = shippingAmount > 0 ? ShippingRate.Express : ShippingRate.Regular;

                var orderId = Guid.NewGuid();
                var order = new Order
                {
                    Id = orderId,
                    CustomerId = customer.Id,
                    Source = Rng.Next(0, 5) == 0 ? OrderSource.EStore : OrderSource.Marketplace,
                    Status = orderStatus,
                    TotalAmount = totalAmount,
                    ShippingAmount = shippingAmount,
                    ShippingRate = shippingRate,
                    RecipientName = $"{customer.FirstName} {customer.LastName}",
                    RecipientPhone = customer.Phone ?? "+905550000000",
                    AddressLine = addrLine,
                    City = city,
                    District = district,
                    PostalCode = postal,
                    Country = "TR",
                    DeliveryLatitude = dlat,
                    DeliveryLongitude = dlon,
                    PaymentId = isPaid ? $"iyz_{Guid.NewGuid():N}"[..20] : null,
                    IsPaid = isPaid,
                    PaidAt = isPaid ? createdAt.AddMinutes(5) : null,
                    CancellationReason =
                        orderStatus == OrderStatus.Cancelled
                            ? "Müşteri tarafından iptal edildi."
                            : null,
                    CreatedAt = createdAt,
                    UpdatedAt = createdAt.AddHours(Rng.Next(1, 5)),
                };

                var orderItems = pickedProducts
                    .Select(p => new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = orderId,
                        ProductId = p.Id,
                        MerchantId = p.MerchantId,
                        ProductName = p.Name,
                        ProductImage = p.Images.FirstOrDefault(),
                        UnitPrice = p.Price,
                        Quantity = Rng.Next(1, 3),
                    })
                    .ToList();

                db.Orders.Add(order);
                db.OrderItems.AddRange(orderItems);
                await db.SaveChangesAsync();

                // Kargo
                if (isPaid && orderStatus != OrderStatus.Cancelled)
                {
                    var courier =
                        shipStatus >= ShipmentStatus.CourierAssigned
                            ? allCouriers[Rng.Next(allCouriers.Count)]
                            : (Courier?)null;

                    var shipment = new Shipment
                    {
                        Id = Guid.NewGuid(),
                        OrderId = orderId,
                        CourierId = courier?.Id,
                        Status = shipStatus,
                        TrackingNumber = $"MP{DateTime.UtcNow.Year}{Rng.Next(10000000, 99999999)}",
                        EstimatedDelivery = createdAt.AddDays(Rng.Next(1, 5)),
                        LabelUrl =
                            orderStatus >= OrderStatus.LabelGenerated
                                ? $"https://cdn.marketplace.com/labels/{orderId}.pdf"
                                : null,
                        CreatedAt = createdAt.AddMinutes(10),
                        UpdatedAt = DateTime.UtcNow,
                    };
                    db.Shipments.Add(shipment);
                    await db.SaveChangesAsync();

                    // Kargo durum geçmişi
                    var historyEntries = BuildShipmentHistory(
                        shipment.Id,
                        shipStatus,
                        createdAt,
                        city
                    );
                    db.ShipmentStatusHistories.AddRange(historyEntries);
                    await db.SaveChangesAsync();
                }

                // Fatura (teslim + transit + yolda + ödendi)
                if (
                    isPaid
                    && orderStatus
                        is OrderStatus.Delivered
                            or OrderStatus.InTransit
                            or OrderStatus.OutForDelivery
                            or OrderStatus.PickedUp
                            or OrderStatus.LabelGenerated
                            or OrderStatus.CourierAssigned
                )
                {
                    var merchant = await db.MerchantProfiles.FirstAsync(m =>
                        m.Id == pickedProducts.First().MerchantId
                    );

                    var vatRate = 0.20m;
                    var vatAmount = Math.Round(subTotal * vatRate, 2);
                    var invNumber = $"INV-{DateTime.UtcNow.Year}-{invoiceCounter++:D6}";

                    var invoiceId = Guid.NewGuid();
                    var invoice = new Invoice
                    {
                        Id = invoiceId,
                        InvoiceNumber = invNumber,
                        OrderId = orderId,
                        MerchantId = merchant.Id,
                        CustomerId = customer.Id,
                        SubTotal = subTotal,
                        VatRate = vatRate,
                        VatAmount = vatAmount,
                        TotalAmount = totalAmount,
                        ShippingAmount = shippingAmount,
                        MerchantStoreName = merchant.StoreName,
                        MerchantAddress = merchant.Address ?? "Türkiye",
                        CustomerFullName = $"{customer.FirstName} {customer.LastName}",
                        CustomerEmail = customer.Email,
                        CustomerAddress = $"{addrLine}, {district}, {city}",
                        PdfUrl = $"https://cdn.marketplace.com/invoices/{invoiceId}.pdf",
                        IsSent = orderStatus == OrderStatus.Delivered,
                        IssuedAt = createdAt.AddMinutes(15),
                        CreatedAt = createdAt.AddMinutes(15),
                    };
                    db.Invoices.Add(invoice);
                    await db.SaveChangesAsync();

                    // Muhasebe kaydı
                    db.AccountingEntries.Add(
                        new AccountingEntry
                        {
                            Id = Guid.NewGuid(),
                            InvoiceId = invoiceId,
                            OrderId = orderId,
                            MerchantId = merchant.Id,
                            EntryType = "SALE",
                            Amount = totalAmount,
                            Description =
                                $"{invNumber} – Satış geliri ({pickedProducts.Count} ürün)",
                            PaymentReference = order.PaymentId,
                            CreatedAt = createdAt.AddMinutes(20),
                        }
                    );
                    await db.SaveChangesAsync();
                }
            }

            Console.WriteLine(
                $"✅ {scenarios.Length} sipariş + kargo + fatura + muhasebe kaydı oluşturuldu."
            );
        }

        Console.WriteLine("\n🚀 Seed tamamlandı.");
        Console.WriteLine("   Admin     : admin@marketplace.com       / Admin123!");
        Console.WriteLine("   Merchant1 : merchant1@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant2 : merchant2@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant3 : merchant3@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant4 : merchant4@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant5 : merchant5@marketplace.com   / Merchant123!");
        Console.WriteLine("   Courier1  : courier1@marketplace.com    / Courier123!");
        Console.WriteLine("   Courier2  : courier2@marketplace.com    / Courier123!");
        Console.WriteLine("   Customer  : ahmet.yilmaz@gmail.com      / Customer123!");
    }

    // ── Yardımcı: Product oluştur ─────────────────────────────────────────────
    private static Product MakeProduct(
        Guid merchantId,
        Guid categoryId,
        string name,
        string desc,
        decimal price,
        int stock,
        string[] tags
    )
    {
        var slug = name.ToLower().Replace(" ", "-").Replace("\"", "");
        return new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            CategoryId = categoryId,
            Name = name,
            Description = desc,
            ShortDescription = desc.Length > 80 ? desc[..80] + "…" : desc,
            Images = [$"https://placehold.co/400x400?text={Uri.EscapeDataString(name)}"],
            Tags = [.. tags],
            Price = price,
            Stock = stock,
            PublishToMarket = true,
            PublishToStore = true,
            IsApproved = true,
            CreatedAt = DateTime.UtcNow.AddDays(-new Random().Next(10, 180)),
            UpdatedAt = DateTime.UtcNow,
        };
    }

    // ── Yardımcı: MerchantPlugin oluştur ──────────────────────────────────────
    private static MerchantPlugin MakeMerchantPlugin(
        Guid merchantId,
        Guid pluginId,
        string? config,
        DateTime expiresAt
    ) =>
        new()
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            PluginId = pluginId,
            IsActive = true,
            Config = config,
            SubscribedAt = DateTime.UtcNow.AddMonths(-1),
            ExpiresAt = expiresAt,
            PaymentId = $"PAY-PLG-{Guid.NewGuid():N}"[..16],
            AutoRenew = true,
            CreatedAt = DateTime.UtcNow.AddMonths(-1),
            UpdatedAt = DateTime.UtcNow,
        };

    // ── Yardımcı: Kargo durum geçmişi oluştur ────────────────────────────────
    private static List<ShipmentStatusHistory> BuildShipmentHistory(
        Guid shipmentId,
        ShipmentStatus targetStatus,
        DateTime baseTime,
        string city
    )
    {
        var history = new List<ShipmentStatusHistory>();
        var statuses = Enum.GetValues<ShipmentStatus>();

        foreach (var status in statuses)
        {
            if (status > targetStatus)
                break;

            var note = status switch
            {
                ShipmentStatus.Pending => "Gönderi oluşturuldu.",
                ShipmentStatus.LabelGenerated => "Kargo etiketi hazırlandı.",
                ShipmentStatus.CourierAssigned => "Kurye atandı, teslim alım bekleniyor.",
                ShipmentStatus.PickedUp => "Kurye tarafından teslim alındı.",
                ShipmentStatus.InTransit => $"{city} dağıtım merkezinde.",
                ShipmentStatus.OutForDelivery => "Kurye yolda, bugün teslim edilecek.",
                ShipmentStatus.Delivered => "Teslimat başarıyla tamamlandı.",
                ShipmentStatus.Failed => "Teslimat başarısız, müşteri bulunamadı.",
                _ => null,
            };

            var offset = (int)status * 4; // her adım ~4 saat
            history.Add(
                new ShipmentStatusHistory
                {
                    Id = Guid.NewGuid(),
                    ShipmentId = shipmentId,
                    Status = status,
                    Note = note,
                    Location = city,
                    ChangedAt = baseTime.AddHours(offset),
                }
            );
        }
        return history;
    }
}
