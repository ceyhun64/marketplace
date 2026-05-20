using api.Domain.Entities;
using api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public static class DataSeeder
{
    private static readonly Random Rng = new(42);

    // Product and store images served from the web server's /public folder
    private static readonly string[] ProductImages =
    [
        "/products/product1.webp",
        "/products/product2.webp",
        "/products/product3.webp",
        "/products/product4.webp",
        "/products/product5.webp",
        "/products/product6.webp",
    ];

    private static readonly string[] StoreLogos =
    [
        "/merchants/merchant1.webp",
        "/merchants/merchant2.webp",
        "/merchants/merchant3.webp",
        "/merchants/merchant4.webp",
        "/merchants/merchant5.webp",
    ];

    private static readonly string[] StoreBanners =
    [
        "/merchants/merchant2.webp",
        "/merchants/merchant3.webp",
        "/merchants/merchant4.webp",
        "/merchants/merchant5.webp",
        "/merchants/merchant1.webp",
    ];

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

        // ── 2. Categories ─────────────────────────────────────────────────────
        if (!await db.Categories.AnyAsync())
        {
            var electronics = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Electronics",
                Slug = "electronics",
                Description = "Technology and electronics products",
                SortOrder = 1,
            };
            var clothing = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Clothing",
                Slug = "clothing",
                Description = "Fashion and apparel",
                SortOrder = 2,
            };
            var homeLiving = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Home & Living",
                Slug = "home-living",
                Description = "Home decor and lifestyle products",
                SortOrder = 3,
            };
            var sports = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Sports",
                Slug = "sports",
                Description = "Sports and outdoor products",
                SortOrder = 4,
            };
            var books = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Books",
                Slug = "books",
                Description = "Books, magazines and publications",
                SortOrder = 5,
            };
            var cosmetics = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Cosmetics",
                Slug = "cosmetics",
                Description = "Beauty and personal care",
                SortOrder = 6,
            };
            var toys = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Toys",
                Slug = "toys",
                Description = "Toys and hobby products",
                SortOrder = 7,
            };

            db.Categories.AddRange(
                electronics,
                clothing,
                homeLiving,
                sports,
                books,
                cosmetics,
                toys,
                // Subcategories
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Mobile Phones",
                    Slug = "mobile-phones",
                    ParentId = electronics.Id,
                    SortOrder = 1,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Laptop",
                    Slug = "laptop",
                    ParentId = electronics.Id,
                    SortOrder = 2,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Tablet",
                    Slug = "tablet",
                    ParentId = electronics.Id,
                    SortOrder = 3,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Headphones",
                    Slug = "headphones",
                    ParentId = electronics.Id,
                    SortOrder = 4,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Smart Watches",
                    Slug = "smart-watches",
                    ParentId = electronics.Id,
                    SortOrder = 5,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Men's Clothing",
                    Slug = "mens-clothing",
                    ParentId = clothing.Id,
                    SortOrder = 1,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Women's Clothing",
                    Slug = "womens-clothing",
                    ParentId = clothing.Id,
                    SortOrder = 2,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Children's Clothing",
                    Slug = "childrens-clothing",
                    ParentId = clothing.Id,
                    SortOrder = 3,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Kitchen",
                    Slug = "kitchen",
                    ParentId = homeLiving.Id,
                    SortOrder = 1,
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Decoration",
                    Slug = "decoration",
                    ParentId = homeLiving.Id,
                    SortOrder = 2,
                }
            );
            await db.SaveChangesAsync();
            Console.WriteLine("✅ 17 categories created.");
        }

        // ── 3. Customer Users ─────────────────────────────────────────────────
        List<User> customers;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Customer))
        {
            var customerData = new[]
            {
                ("alex.morgan@gmail.com", "Alex", "Morgan", "+905551234567"),
                ("emily.carter@gmail.com", "Emily", "Carter", "+905552345678"),
                ("michael.reed@hotmail.com", "Michael", "Reed", "+905553456789"),
                ("sophia.bell@gmail.com", "Sophia", "Bell", "+905554567890"),
                ("james.hunter@gmail.com", "James", "Hunter", "+905555678901"),
                ("olivia.grant@outlook.com", "Olivia", "Grant", "+905556789012"),
                ("william.hayes@gmail.com", "William", "Hayes", "+905557890123"),
                ("isabella.ford@gmail.com", "Isabella", "Ford", "+905558901234"),
                ("benjamin.scott@gmail.com", "Benjamin", "Scott", "+905559012345"),
                ("charlotte.price@hotmail.com", "Charlotte", "Price", "+905550123456"),
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
            Console.WriteLine($"✅ {customers.Count} customers created.");
        }
        else
        {
            customers = await db.Users.Where(u => u.Role == UserRole.Customer).ToListAsync();
        }

        // ── 4. Merchant Users & Profiles ──────────────────────────────────────
        List<MerchantProfile> merchants;
        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Merchant))
        {
            var merchantData = new[]
            {
                (
                    "merchant1@marketplace.com",
                    "Tech",
                    "Merchant",
                    "TechStore",
                    "techstore",
                    "Istanbul, Turkey",
                    "Istanbul",
                    41.0082,
                    28.9784,
                    24,
                    PlanType.Pro
                ),
                (
                    "merchant2@marketplace.com",
                    "Fashion",
                    "Merchant",
                    "Fashion World",
                    "fashion-world",
                    "Ankara, Turkey",
                    "Ankara",
                    39.9334,
                    32.8597,
                    48,
                    PlanType.Basic
                ),
                (
                    "merchant3@marketplace.com",
                    "Home",
                    "Merchant",
                    "Home & Decor",
                    "home-decor",
                    "Izmir, Turkey",
                    "Izmir",
                    38.4192,
                    27.1287,
                    36,
                    PlanType.Pro
                ),
                (
                    "merchant4@marketplace.com",
                    "Sports",
                    "World",
                    "Sports World",
                    "sports-world",
                    "Bursa, Turkey",
                    "Bursa",
                    40.1826,
                    29.0665,
                    24,
                    PlanType.Enterprise
                ),
                (
                    "merchant5@marketplace.com",
                    "Book",
                    "Center",
                    "Book Center",
                    "book-center",
                    "Antalya, Turkey",
                    "Antalya",
                    36.8969,
                    30.7133,
                    12,
                    PlanType.Basic
                ),
            };

            merchants = new List<MerchantProfile>();
            int merchantIdx = 0;
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
                    Description = slug switch
                    {
                        "techstore" =>
                            "TechStore has been offering the latest smartphones, laptops, tablets and accessories at competitive prices since 2018. Shop with confidence backed by authorized service support and a 2-year warranty.",
                        "fashion-world" =>
                            "Fashion World is a boutique store bringing together Turkey's leading national and international fashion brands under one roof. The latest collections for men, women and children are refreshed every season.",
                        "home-decor" =>
                            "Home & Decor offers quality, guaranteed kitchen appliances, furniture and decoration products to transform your living space. We bring Scandinavian aesthetics and modern touches to your home.",
                        "sports-world" =>
                            "Sports World provides equipment and apparel for athletes of every level, from amateur to professional. Thousands of product options for running, cycling, tennis, swimming and more.",
                        "book-center" =>
                            "Book Center is your online bookstore offering English and foreign-language titles across personal development, fiction, history and science fiction. The go-to destination for book lovers with fast shipping and careful packaging.",
                        _ => $"{store} — Your trusted shopping destination.",
                    },
                    Address = address,
                    City = city,
                    Country = "TR",
                    Latitude = lat,
                    Longitude = lon,
                    HandlingHours = hours,
                    LogoUrl = StoreLogos[merchantIdx % StoreLogos.Length],
                    BannerUrl = StoreBanners[merchantIdx % StoreBanners.Length],
                    IsActive = true,
                    CreatedAt = mUser.CreatedAt,
                    UpdatedAt = DateTime.UtcNow,
                };
                merchantIdx++;
                db.MerchantProfiles.Add(profile);
                await db.SaveChangesAsync();

                // Subscription
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
            Console.WriteLine($"✅ {merchants.Count} merchants + subscriptions created.");
        }
        else
        {
            merchants = await db.MerchantProfiles.ToListAsync();
        }

        // ── 5. Couriers ───────────────────────────────────────────────────────
        List<Courier> couriers;

        var courierData = new[]
        {
            (
                "courier1@marketplace.com",
                "Kevin",
                "Pollard",
                "Motorcycle",
                "34ABC123",
                41.015,
                28.979
            ),
            ("courier2@marketplace.com", "Steven", "Greene", "Car", "06XYZ456", 39.920, 32.854),
            (
                "courier3@marketplace.com",
                "Brian",
                "Aydin",
                "Bicycle",
                "35QWE789",
                38.430,
                27.140
            ),
            (
                "courier4@marketplace.com",
                "Eric",
                "Stone",
                "Motorcycle",
                "16DEF012",
                40.195,
                29.058
            ),
        };

        couriers = new List<Courier>();
        foreach (var (email, first, last, vehicle, plate, lat, lon) in courierData)
        {
            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existingUser == null)
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
                Console.WriteLine($"✅ Courier created: {email}");
            }
            else
            {
                // Synchronize the existing courier user's password and status
                if (!BCrypt.Net.BCrypt.Verify("Courier123!", existingUser.PasswordHash))
                {
                    existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Courier123!");
                    existingUser.AccountStatus = AccountStatus.Active;
                    existingUser.IsVerified = true;
                    existingUser.UpdatedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                    Console.WriteLine($"🔑 Courier password updated: {email}");
                }
                // Create courier record if it does not exist
                var existingCourier = await db.Couriers.FirstOrDefaultAsync(c => c.UserId == existingUser.Id);
                if (existingCourier == null)
                {
                    var courier = new Courier
                    {
                        Id = Guid.NewGuid(),
                        UserId = existingUser.Id,
                        VehicleType = vehicle,
                        PlateNumber = plate,
                        IsActive = true,
                        IsAvailable = Rng.Next(0, 2) == 1,
                        CurrentLatitude = lat,
                        CurrentLongitude = lon,
                        LastLocationUpdate = DateTime.UtcNow.AddMinutes(-Rng.Next(5, 120)),
                        CreatedAt = existingUser.CreatedAt,
                    };
                    db.Couriers.Add(courier);
                    await db.SaveChangesAsync();
                    couriers.Add(courier);
                    Console.WriteLine($"✅ Courier profile created: {email}");
                }
                else
                {
                    couriers.Add(existingCourier);
                }
            }
        }

        if (!couriers.Any())
        {
            couriers = await db.Couriers.ToListAsync();
        }

        // ── 6. Products ───────────────────────────────────────────────────────
        if (!await db.Products.AnyAsync())
        {
            var mobilePhonesCat = await db.Categories.FirstAsync(c => c.Slug == "mobile-phones");
            var laptopCat = await db.Categories.FirstAsync(c => c.Slug == "laptop");
            var tabletCat = await db.Categories.FirstAsync(c => c.Slug == "tablet");
            var headphonesCat = await db.Categories.FirstAsync(c => c.Slug == "headphones");
            var smartWatchesCat = await db.Categories.FirstAsync(c => c.Slug == "smart-watches");
            var mensClothing = await db.Categories.FirstAsync(c => c.Slug == "mens-clothing");
            var womensClothing = await db.Categories.FirstAsync(c => c.Slug == "womens-clothing");
            var kitchenCat = await db.Categories.FirstAsync(c => c.Slug == "kitchen");
            var decorCat = await db.Categories.FirstAsync(c => c.Slug == "decoration");
            var sportsCat = await db.Categories.FirstAsync(c => c.Slug == "sports");
            var booksCat = await db.Categories.FirstAsync(c => c.Slug == "books");

            var techM = merchants.First(m => m.Slug == "techstore");
            var fashionM = merchants.First(m => m.Slug == "fashion-world");
            var homeM = merchants.First(m => m.Slug == "home-decor");
            var sportsM = merchants.First(m => m.Slug == "sports-world");
            var bookM = merchants.First(m => m.Slug == "book-center");

            var products = new List<Product>
            {
                // TechStore products
                MakeProduct(
                    techM.Id,
                    mobilePhonesCat.Id,
                    "Samsung Galaxy S24",
                    "6.2-inch Dynamic AMOLED, Snapdragon 8 Gen 3, 50MP camera. A revolution in night photography.",
                    44999m,
                    15,
                    ["samsung", "android", "5g"]
                ),
                MakeProduct(
                    techM.Id,
                    mobilePhonesCat.Id,
                    "Apple iPhone 16 Pro",
                    "6.1-inch Super Retina XDR, A18 Pro chip, 48MP camera. Designed for professionals.",
                    54999m,
                    8,
                    ["apple", "ios", "5g"]
                ),
                MakeProduct(
                    techM.Id,
                    mobilePhonesCat.Id,
                    "Xiaomi 14 Ultra",
                    "6.73-inch LTPO AMOLED, Snapdragon 8 Gen 3, 50MP Leica Quad camera. For photography enthusiasts.",
                    39999m,
                    12,
                    ["xiaomi", "leica", "android"]
                ),
                MakeProduct(
                    techM.Id,
                    laptopCat.Id,
                    "MacBook Air M3",
                    "13.6-inch Liquid Retina, Apple M3, 16GB RAM, 512GB SSD. The pinnacle of portability.",
                    67999m,
                    5,
                    ["apple", "laptop", "m3"]
                ),
                MakeProduct(
                    techM.Id,
                    laptopCat.Id,
                    "Lenovo ThinkPad X1 Carbon",
                    "14-inch IPS, Intel Core Ultra 7, 32GB RAM, 1TB SSD. Ideal for enterprise use.",
                    59999m,
                    4,
                    ["lenovo", "laptop", "business"]
                ),
                MakeProduct(
                    techM.Id,
                    laptopCat.Id,
                    "ASUS ROG Zephyrus G16",
                    "16-inch QHD 240Hz, RTX 4080, Ryzen 9 8945HS. Top-tier gaming performance.",
                    72999m,
                    3,
                    ["asus", "gaming", "rtx4080"]
                ),
                MakeProduct(
                    techM.Id,
                    tabletCat.Id,
                    "iPad Pro 13 M4",
                    "13-inch Ultra Retina XDR, M4 chip, 256GB. Transcendently thin design with limitless power.",
                    49999m,
                    6,
                    ["apple", "ipad", "m4"]
                ),
                MakeProduct(
                    techM.Id,
                    headphonesCat.Id,
                    "Sony WH-1000XM5",
                    "30-hour battery, industry-leading noise cancellation, multi-device connectivity.",
                    8999m,
                    25,
                    ["sony", "headphones", "anc"]
                ),
                MakeProduct(
                    techM.Id,
                    headphonesCat.Id,
                    "AirPods Pro 2nd Generation",
                    "Adaptive audio, Personalized Spatial Audio, USB-C charging case.",
                    7499m,
                    30,
                    ["apple", "airpods", "tws"]
                ),
                MakeProduct(
                    techM.Id,
                    smartWatchesCat.Id,
                    "Apple Watch Series 10",
                    "49mm titanium case, dual-band GPS, blood oxygen, sleep tracking.",
                    14999m,
                    10,
                    ["apple", "watch", "fitness"]
                ),
                MakeProduct(
                    techM.Id,
                    smartWatchesCat.Id,
                    "Samsung Galaxy Watch 7",
                    "44mm, BioActive sensor, 40-hour battery, Wear OS. Perfect integration with the Android ecosystem.",
                    9999m,
                    18,
                    ["samsung", "watch", "android"]
                ),
                // Fashion World products
                MakeProduct(
                    fashionM.Id,
                    mensClothing.Id,
                    "Levi's 501 Original Jean",
                    "Classic straight-cut men's denim jeans, 100% organic cotton. Timeless style.",
                    1299m,
                    50,
                    ["levis", "denim", "mens"]
                ),
                MakeProduct(
                    fashionM.Id,
                    mensClothing.Id,
                    "Tommy Hilfiger Polo",
                    "Slim fit cotton polo shirt with small logo embroidery. Perfect for the office and everyday wear.",
                    799m,
                    40,
                    ["tommy", "polo", "mens"]
                ),
                MakeProduct(
                    fashionM.Id,
                    womensClothing.Id,
                    "Mango Midi Dress",
                    "Woven fabric midi dress. Summer collection 2026.",
                    1499m,
                    35,
                    ["mango", "dress", "summer"]
                ),
                MakeProduct(
                    fashionM.Id,
                    womensClothing.Id,
                    "Zara Blazer Jacket",
                    "Fitted blazer jacket with buttoned collar. The symbol of elegance in the workplace.",
                    2199m,
                    20,
                    ["zara", "blazer", "womens"]
                ),
                MakeProduct(
                    fashionM.Id,
                    sportsCat.Id,
                    "Nike Air Max 2024",
                    "High-comfort running shoe with Air Max cushioning system. Maximum comfort.",
                    4499m,
                    20,
                    ["nike", "running", "sports"]
                ),
                MakeProduct(
                    fashionM.Id,
                    sportsCat.Id,
                    "Adidas Ultraboost 24",
                    "Responsive Boost midsole, Primeknit+ fabric upper. The runner's choice.",
                    3999m,
                    15,
                    ["adidas", "running", "boost"]
                ),
                // Home & Decor products
                MakeProduct(
                    homeM.Id,
                    kitchenCat.Id,
                    "Philips Airfryer XXL",
                    "7L capacity digital air fryer, 7 cooking modes, smart touch screen.",
                    3299m,
                    10,
                    ["philips", "kitchen", "airfryer"]
                ),
                MakeProduct(
                    homeM.Id,
                    kitchenCat.Id,
                    "Tefal Grandhall XXL",
                    "2400W barbecue grill, 75x32 cm grilling surface, foldable design.",
                    2499m,
                    8,
                    ["tefal", "grill", "bbq"]
                ),
                MakeProduct(
                    homeM.Id,
                    kitchenCat.Id,
                    "Nespresso Vertuo Pop",
                    "5 barista-inspired coffee sizes. Compact design, ready in 14 seconds.",
                    1999m,
                    14,
                    ["nespresso", "coffee", "espresso"]
                ),
                MakeProduct(
                    homeM.Id,
                    decorCat.Id,
                    "Dyson V15 Detect",
                    "Laser dust detection, 60-minute battery, HEPA filter. A revolution in cordless vacuuming.",
                    18999m,
                    7,
                    ["dyson", "vacuum", "cordless"]
                ),
                MakeProduct(
                    homeM.Id,
                    decorCat.Id,
                    "IKEA BILLY Bookcase",
                    "80x28x202 cm, white, adjustable shelves. Scandi minimalist design.",
                    899m,
                    22,
                    ["ikea", "bookcase", "decor"]
                ),
                // Sports World products
                MakeProduct(
                    sportsM.Id,
                    sportsCat.Id,
                    "Garmin Forerunner 965",
                    "AMOLED display, GPS, heart rate, VO2 max measurement. Optimize your half-marathon strategy.",
                    15999m,
                    6,
                    ["garmin", "gps", "running"]
                ),
                MakeProduct(
                    sportsM.Id,
                    sportsCat.Id,
                    "Decathlon Mountain Bike 27.5\"",
                    "Mountain bike, 21-speed Shimano, hydraulic disc brakes. Ready for off-road adventure.",
                    6999m,
                    9,
                    ["bicycle", "mtb", "shimano"]
                ),
                MakeProduct(
                    sportsM.Id,
                    sportsCat.Id,
                    "Wilson Pro Staff Tennis",
                    "97-inch head, 315g, 18x20 string pattern. Professional tennis racket.",
                    4299m,
                    11,
                    ["wilson", "tennis", "pro"]
                ),
                // Book Center products
                MakeProduct(
                    bookM.Id,
                    booksCat.Id,
                    "Atomic Habits - James Clear",
                    "Small changes, remarkable results. 320 pages. 15M+ copies sold worldwide.",
                    189m,
                    100,
                    ["books", "self-improvement", "bestseller"]
                ),
                MakeProduct(
                    bookM.Id,
                    booksCat.Id,
                    "Sapiens - Yuval Noah Harari",
                    "A brief history of humankind. 500+ pages. A book that will fundamentally change how you think.",
                    249m,
                    80,
                    ["books", "history", "harari"]
                ),
                MakeProduct(
                    bookM.Id,
                    booksCat.Id,
                    "Dune - Frank Herbert",
                    "The desert planet. A masterpiece of science fiction, 800 pages.",
                    219m,
                    60,
                    ["books", "sci-fi", "dune"]
                ),
                MakeProduct(
                    bookM.Id,
                    booksCat.Id,
                    "The Art of War - Sun Tzu",
                    "A classic of strategy and leadership. 160 pages. Essential reading for every manager.",
                    149m,
                    120,
                    ["books", "strategy", "classic"]
                ),
            };

            db.Products.AddRange(products);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {products.Count} products created.");
        }

        // ── 7. Plugins ────────────────────────────────────────────────────────
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
                        "Google Analytics integration for your store. Track visitors, conversions and revenue reports in real time.",
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
                        "Chat with your customers in real time. Includes AI-powered automatic responses.",
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
                        "Automatic management of meta tags, XML sitemaps and structured data. Boost your search engine visibility.",
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
                    Name = "Email Marketing",
                    Slug = "email-marketing",
                    Description =
                        "Automated campaign delivery, segmentation and open-rate tracking. Powered by Mailchimp and SendGrid.",
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
                    Name = "Accounting Integration",
                    Slug = "accounting",
                    Description =
                        "Automatically synchronize invoices, payments and accounting records. Supports Logo, Mikro and Parasut.",
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
                    Name = "WhatsApp Notifications",
                    Slug = "whatsapp-notify",
                    Description =
                        "Automatically send order status updates to your customers via WhatsApp.",
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
                        "Facebook Pixel integration for retargeting campaigns. Triple your conversions.",
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
                    Name = "Discount Coupons",
                    Slug = "coupon-manager",
                    Description =
                        "Flexible coupon and discount code management. Percentage or fixed discounts, single or multi-use.",
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
            Console.WriteLine($"✅ {plugins.Count} plugins created.");
        }

        // ── 8. MerchantPlugin Subscriptions ───────────────────────────────────
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

            var techM = allMerchants.FirstOrDefault(m => m.Slug == "techstore");
            var fashionM = allMerchants.FirstOrDefault(m => m.Slug == "fashion-world");
            var sportsM = allMerchants.FirstOrDefault(m => m.Slug == "sports-world");

            if (techM == null || fashionM == null || sportsM == null)
            {
                Console.WriteLine(
                    "⚠️  MerchantPlugin seed skipped: required merchant profiles not found "
                        + $"(techstore={techM != null}, fashion={fashionM != null}, sports={sportsM != null})."
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
                    "⚠️  MerchantPlugin seed skipped: required plugin records not found."
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
                    MakeMerchantPlugin(fashionM.Id, gaPlugin.Id, null, DateTime.UtcNow.AddMonths(1)),
                    MakeMerchantPlugin(
                        fashionM.Id,
                        emailPlugin.Id,
                        "{\"apiKey\":\"mc_moda_key99\"}",
                        DateTime.UtcNow.AddMonths(2)
                    ),
                    MakeMerchantPlugin(
                        fashionM.Id,
                        whatsPlugin.Id,
                        "{\"phone\":\"+905551112233\"}",
                        DateTime.UtcNow.AddMonths(1)
                    ),
                    MakeMerchantPlugin(sportsM.Id, gaPlugin.Id, null, DateTime.UtcNow.AddMonths(4)),
                    MakeMerchantPlugin(
                        sportsM.Id,
                        fbPlugin.Id,
                        "{\"pixelId\":\"1234567890\"}",
                        DateTime.UtcNow.AddMonths(2)
                    )
                );
                await db.SaveChangesAsync();
                Console.WriteLine("✅ 9 merchant plugin subscriptions created.");
            }
        }

        // ── 9. Orders, Shipments & Invoices ───────────────────────────────────
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
                ("Kadikoy", "Istanbul", "Moda Ave. No:12", "34710", 40.991, 29.028),
                ("Cankaya", "Ankara", "Kizilay St. No:5", "06540", 39.912, 32.861),
                ("Bornova", "Izmir", "Ege Blvd. No:88", "35100", 38.458, 27.221),
                ("Nilufer", "Bursa", "Cekirge Ave. No:3", "16110", 40.212, 28.973),
                ("Muratpasa", "Antalya", "Cumhuriyet Quarter No:7", "07040", 36.887, 30.705),
                ("Sisli", "Istanbul", "Nisantasi Ave. No:1", "34365", 41.049, 28.991),
                ("Kecioren", "Ankara", "Etlik St. No:22", "06380", 39.964, 32.854),
            };

            int invoiceCounter = 1;

            foreach (var (orderStatus, isPaid, shipStatus, daysAgo) in scenarios)
            {
                var customer = allCustomers[Rng.Next(allCustomers.Count)];
                var (district, city, addrLine, postal, dlat, dlon) = addresses[
                    Rng.Next(addresses.Length)
                ];

                // Select 1-3 products
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
                            ? "Cancelled by the customer."
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

                // Shipment
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

                    // Shipment status history
                    var historyEntries = BuildShipmentHistory(
                        shipment.Id,
                        shipStatus,
                        createdAt,
                        city
                    );
                    db.ShipmentStatusHistories.AddRange(historyEntries);
                    await db.SaveChangesAsync();
                }

                // Invoice (delivered + in transit + out for delivery + paid)
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
                        MerchantAddress = merchant.Address ?? "Turkey",
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

                    // Accounting entry
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
                                $"{invNumber} – Sales revenue ({pickedProducts.Count} items)",
                            PaymentReference = order.PaymentId,
                            CreatedAt = createdAt.AddMinutes(20),
                        }
                    );
                    await db.SaveChangesAsync();
                }
            }

            Console.WriteLine(
                $"✅ {scenarios.Length} orders + shipments + invoices + accounting entries created."
            );
        }

        Console.WriteLine("\n🚀 Seed completed.");
        Console.WriteLine("   Admin     : admin@marketplace.com       / Admin123!");
        Console.WriteLine("   Merchant1 : merchant1@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant2 : merchant2@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant3 : merchant3@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant4 : merchant4@marketplace.com   / Merchant123!");
        Console.WriteLine("   Merchant5 : merchant5@marketplace.com   / Merchant123!");
        Console.WriteLine("   Courier1  : courier1@marketplace.com    / Courier123!");
        Console.WriteLine("   Courier2  : courier2@marketplace.com    / Courier123!");
        Console.WriteLine("   Customer  : alex.morgan@gmail.com        / Customer123!");
    }

    // ── Helper: Create Product ────────────────────────────────────────────────
    private static int _productImageIndex = 0;

    // Predefined image set combinations to assign 2-3 images per product
    private static readonly string[][] ProductImageSets =
    [
        ["/products/product1.webp", "/products/product2.webp", "/products/product3.webp"],
        ["/products/product2.webp", "/products/product3.webp", "/products/product4.webp"],
        ["/products/product3.webp", "/products/product4.webp", "/products/product5.webp"],
        ["/products/product4.webp", "/products/product5.webp", "/products/product6.webp"],
        ["/products/product5.webp", "/products/product6.webp", "/products/product1.webp"],
        ["/products/product6.webp", "/products/product1.webp", "/products/product2.webp"],
        ["/products/product1.webp", "/products/product4.webp"],
        ["/products/product2.webp", "/products/product5.webp"],
        ["/products/product3.webp", "/products/product6.webp"],
        ["/products/product4.webp", "/products/product1.webp"],
        ["/products/product5.webp", "/products/product2.webp"],
        ["/products/product6.webp", "/products/product3.webp"],
    ];

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
        // Assign a different image combination to each product in a round-robin fashion
        var imageSet = ProductImageSets[_productImageIndex % ProductImageSets.Length];
        _productImageIndex++;

        var slug = name.ToLower().Replace(" ", "-").Replace("\"", "");
        return new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            CategoryId = categoryId,
            Name = name,
            Description = desc,
            ShortDescription = desc.Length > 80 ? desc[..80] + "…" : desc,
            Images = [.. imageSet],
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

    // ── Helper: Create MerchantPlugin ─────────────────────────────────────────
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

    // ── Helper: Build shipment status history ─────────────────────────────────
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
                ShipmentStatus.Pending => "Shipment created.",
                ShipmentStatus.LabelGenerated => "Shipping label generated.",
                ShipmentStatus.CourierAssigned => "Courier assigned, awaiting pickup.",
                ShipmentStatus.PickedUp => "Picked up by courier.",
                ShipmentStatus.InTransit => $"At {city} distribution center.",
                ShipmentStatus.OutForDelivery => "Courier en route, delivery expected today.",
                ShipmentStatus.Delivered => "Delivery successfully completed.",
                ShipmentStatus.Failed => "Delivery failed, customer not available.",
                _ => null,
            };

            var offset = (int)status * 4; // each step ~4 hours
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
