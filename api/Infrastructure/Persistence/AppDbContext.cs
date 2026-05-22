using System.Text.Json;
using api.Domain.Entities;
using api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    // ── Core ──────────────────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<MerchantProfile> MerchantProfiles => Set<MerchantProfile>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Category> Categories => Set<Category>();

    // ── Orders ────────────────────────────────────────────────────────────────
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<VendorOrder> VendorOrders => Set<VendorOrder>();

    // ── Fulfilment ────────────────────────────────────────────────────────────
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentStatusHistory> ShipmentStatusHistories => Set<ShipmentStatusHistory>();
    public DbSet<Courier> Couriers => Set<Courier>();

    // ── Wallet / Finance ──────────────────────────────────────────────────────
    public DbSet<MerchantWallet> MerchantWallets => Set<MerchantWallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<AccountingEntry> AccountingEntries => Set<AccountingEntry>();

    // ── Extras ────────────────────────────────────────────────────────────────
    public DbSet<Plugin> Plugins => Set<Plugin>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<MerchantPlugin> MerchantPlugins => Set<MerchantPlugin>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<ProductQuestion> ProductQuestions => Set<ProductQuestion>();

    // ── Site Settings ─────────────────────────────────────────────────────────
    public DbSet<AnnouncementItem> Announcements => Set<AnnouncementItem>();
    public DbSet<HeroSettings> HeroSettings => Set<HeroSettings>();

    // ── Commission / Finance ──────────────────────────────────────────────────
    public DbSet<CommissionRule> CommissionRules => Set<CommissionRule>();
    public DbSet<WithdrawalRequest> WithdrawalRequests => Set<WithdrawalRequest>();

    // ── Returns & Disputes ────────────────────────────────────────────────────
    public DbSet<ReturnRequest> ReturnRequests => Set<ReturnRequest>();
    public DbSet<ReturnRequestItem> ReturnRequestItems => Set<ReturnRequestItem>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeMessage> DisputeMessages => Set<DisputeMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Unique indexes ────────────────────────────────────────────────────
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<MerchantProfile>().HasIndex(m => m.Slug).IsUnique();
        modelBuilder.Entity<MerchantProfile>().HasIndex(m => m.UserId).IsUnique();
        modelBuilder.Entity<Courier>().HasIndex(c => c.UserId).IsUnique();
        modelBuilder.Entity<Shipment>().HasIndex(s => s.TrackingNumber).IsUnique();
        // OrderId is NO LONGER unique — one Order can have many Shipments (one per VendorOrder)
        modelBuilder.Entity<Shipment>().HasIndex(s => s.OrderId);
        // Each VendorOrder gets at most one Shipment
        modelBuilder.Entity<Shipment>().HasIndex(s => s.VendorOrderId).IsUnique();
        modelBuilder.Entity<Invoice>().HasIndex(i => i.InvoiceNumber).IsUnique();
        modelBuilder.Entity<Invoice>().HasIndex(i => i.OrderId).IsUnique();
        modelBuilder.Entity<Subscription>().HasIndex(s => s.MerchantId).IsUnique();
        modelBuilder.Entity<MerchantWallet>().HasIndex(w => w.MerchantId).IsUnique();
        modelBuilder.Entity<ProductVariant>().HasIndex(v => new { v.ProductId, v.SKU }).IsUnique();

        // ── VendorOrder composite index (merchant looks up their sub-orders) ─
        modelBuilder.Entity<VendorOrder>().HasIndex(vo => new { vo.MerchantId, vo.Status });
        modelBuilder.Entity<VendorOrder>().HasIndex(vo => vo.OrderId);

        // ── Product: full-text search GIN index (PostgreSQL) ─────────────────
        modelBuilder
            .Entity<Product>()
            .HasGeneratedTsVectorColumn(
                p => p.SearchVector!,
                "english",
                p => new { p.Name, p.Description }
            )
            .HasIndex(p => p.SearchVector)
            .HasMethod("GIN");

        // ── Product: composite B-tree indexes ────────────────────────────────
        // Most common marketplace listing query
        modelBuilder
            .Entity<Product>()
            .HasIndex(p => new
            {
                p.PublishToMarket,
                p.IsApproved,
                p.IsDeleted,
                p.CategoryId,
                p.Price,
            });
        // Merchant product management
        modelBuilder
            .Entity<Product>()
            .HasIndex(p => new
            {
                p.MerchantId,
                p.IsDeleted,
                p.PublishToMarket,
            });
        // Admin pending approval queue
        modelBuilder
            .Entity<Product>()
            .HasIndex(p => new
            {
                p.IsApproved,
                p.IsDeleted,
                p.CreatedAt,
            });

        // ── Concurrency tokens ────────────────────────────────────────────────
        modelBuilder
            .Entity<MerchantWallet>()
            .Property(w => w.RowVersion)
            .IsRowVersion()
            .IsConcurrencyToken();

        modelBuilder
            .Entity<Product>()
            .Property(p => p.RowVersion)
            .IsRowVersion()
            .IsConcurrencyToken();

        // ── Enum → string ─────────────────────────────────────────────────────
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<User>().Property(u => u.AccountStatus).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Source).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.ShippingRate).HasConversion<string>();
        modelBuilder.Entity<VendorOrder>().Property(vo => vo.Status).HasConversion<string>();
        modelBuilder.Entity<Shipment>().Property(s => s.Status).HasConversion<string>();
        modelBuilder
            .Entity<ShipmentStatusHistory>()
            .Property(h => h.Status)
            .HasConversion<string>();

        // ── JSONB columns ─────────────────────────────────────────────────────
        modelBuilder.Entity<ProductVariant>().Property(v => v.Attributes)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new());

        modelBuilder.Entity<OrderItem>().Property(i => i.VariantAttributes)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new());

        // ── Subscription → MerchantProfile (1:1) ─────────────────────────────
        modelBuilder
            .Entity<Subscription>()
            .HasOne(s => s.Merchant)
            .WithOne(m => m.Subscription)
            .HasForeignKey<Subscription>(s => s.MerchantId);

        // ── MerchantProfile → Products (1:N) ──────────────────────────────────
        modelBuilder
            .Entity<Product>()
            .HasOne(p => p.Merchant)
            .WithMany(m => m.Products)
            .HasForeignKey(p => p.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Product → ProductVariants (1:N) ───────────────────────────────────
        modelBuilder
            .Entity<ProductVariant>()
            .HasOne(v => v.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Category self-referencing ─────────────────────────────────────────
        modelBuilder
            .Entity<Category>()
            .HasMany(c => c.SubCategories)
            .WithOne(c => c.Parent)
            .HasForeignKey(c => c.ParentId);

        // ── Order → OrderItems (1:N) ──────────────────────────────────────────
        modelBuilder
            .Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Order → VendorOrders (1:N) ────────────────────────────────────────
        modelBuilder
            .Entity<VendorOrder>()
            .HasOne(vo => vo.Order)
            .WithMany()
            .HasForeignKey(vo => vo.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<VendorOrder>()
            .HasOne(vo => vo.Merchant)
            .WithMany()
            .HasForeignKey(vo => vo.MerchantId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── VendorOrder → OrderItems (1:N, nullable FK) ───────────────────────
        modelBuilder
            .Entity<OrderItem>()
            .HasOne(i => i.VendorOrder)
            .WithMany(vo => vo.Items)
            .HasForeignKey(i => i.VendorOrderId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // ── OrderItem → ProductVariant (N:1, nullable) ────────────────────────
        modelBuilder
            .Entity<OrderItem>()
            .HasOne(i => i.Variant)
            .WithMany()
            .HasForeignKey(i => i.VariantId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Order → Shipment (1:1) ────────────────────────────────────────────
        modelBuilder
            .Entity<Order>()
            .HasOne(o => o.Shipment)
            .WithOne(s => s.Order)
            .HasForeignKey<Shipment>(s => s.OrderId);

        // ── Order → Invoice (1:1) ─────────────────────────────────────────────
        modelBuilder
            .Entity<Order>()
            .HasOne(o => o.Invoice)
            .WithOne(i => i.Order)
            .HasForeignKey<Invoice>(i => i.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Invoice → AccountingEntries (1:N) ─────────────────────────────────
        modelBuilder
            .Entity<AccountingEntry>()
            .HasOne(a => a.Invoice)
            .WithMany(i => i.AccountingEntries)
            .HasForeignKey(a => a.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<AccountingEntry>()
            .HasOne(a => a.Order)
            .WithMany()
            .HasForeignKey(a => a.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder
            .Entity<AccountingEntry>()
            .HasOne(a => a.Merchant)
            .WithMany()
            .HasForeignKey(a => a.MerchantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder
            .Entity<Invoice>()
            .HasOne(i => i.Merchant)
            .WithMany()
            .HasForeignKey(i => i.MerchantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder
            .Entity<Invoice>()
            .HasOne(i => i.Customer)
            .WithMany()
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── MerchantWallet (1:1 per merchant) ─────────────────────────────────
        modelBuilder
            .Entity<MerchantWallet>()
            .HasOne(w => w.Merchant)
            .WithMany()
            .HasForeignKey(w => w.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── WalletTransaction (N:1 → MerchantWallet) ─────────────────────────
        modelBuilder
            .Entity<WalletTransaction>()
            .HasOne(t => t.Wallet)
            .WithMany(w => w.Transactions)
            .HasForeignKey(t => t.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<WalletTransaction>()
            .HasOne(t => t.Merchant)
            .WithMany()
            .HasForeignKey(t => t.MerchantId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Plugin → MerchantPlugin (1:N) ─────────────────────────────────────
        modelBuilder
            .Entity<MerchantPlugin>()
            .HasOne(mp => mp.Plugin)
            .WithMany(p => p.MerchantPlugins)
            .HasForeignKey(mp => mp.PluginId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<MerchantPlugin>()
            .HasOne(mp => mp.Merchant)
            .WithMany()
            .HasForeignKey(mp => mp.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Shipment → ShipmentStatusHistory (1:N) ────────────────────────────
        modelBuilder
            .Entity<Shipment>()
            .HasMany(s => s.StatusHistory)
            .WithOne(h => h.Shipment)
            .HasForeignKey(h => h.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Shipment → Courier (N:1, nullable) ────────────────────────────────
        modelBuilder
            .Entity<Shipment>()
            .HasOne(s => s.Courier)
            .WithMany(c => c.Shipments)
            .HasForeignKey(s => s.CourierId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Review → Product / Customer ───────────────────────────────────────
        modelBuilder
            .Entity<Review>()
            .HasOne(r => r.Product)
            .WithMany(p => p.Reviews)
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<Review>()
            .HasOne(r => r.Customer)
            .WithMany()
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>().HasIndex(r => new { r.CustomerId, r.ProductId }).IsUnique();

        // ── Courier → User (1:1) ──────────────────────────────────────────────
        modelBuilder
            .Entity<Courier>()
            .HasOne(c => c.User)
            .WithOne(u => u.Courier)
            .HasForeignKey<Courier>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── OrderItem → Product (N:1) ─────────────────────────────────────────
        modelBuilder
            .Entity<OrderItem>()
            .HasOne(i => i.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── WishlistItem ──────────────────────────────────────────────────────
        modelBuilder
            .Entity<WishlistItem>()
            .HasOne(w => w.Product)
            .WithMany(p => p.WishlistItems)
            .HasForeignKey(w => w.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<WishlistItem>()
            .HasIndex(w => new { w.CustomerId, w.ProductId })
            .IsUnique();

        modelBuilder
            .Entity<WishlistItem>()
            .HasOne(w => w.Customer)
            .WithMany()
            .HasForeignKey(w => w.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<WishlistItem>()
            .HasOne(w => w.Product)
            .WithMany()
            .HasForeignKey(w => w.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── ProductQuestion ───────────────────────────────────────────────────
        modelBuilder
            .Entity<ProductQuestion>()
            .HasOne(q => q.Product)
            .WithMany()
            .HasForeignKey(q => q.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<ProductQuestion>()
            .HasOne(q => q.Customer)
            .WithMany()
            .HasForeignKey(q => q.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<ProductQuestion>()
            .HasOne(q => q.AnsweredByMerchant)
            .WithMany()
            .HasForeignKey(q => q.AnsweredByMerchantId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // ── decimal precision ─────────────────────────────────────────────────
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Order>().Property(o => o.ShippingAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<OrderItem>().Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Product>().Property(p => p.Price).HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<ProductVariant>()
            .Property(v => v.PriceOverride)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<VendorOrder>()
            .Property(vo => vo.SubTotal)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<VendorOrder>()
            .Property(vo => vo.PlatformFee)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<VendorOrder>()
            .Property(vo => vo.MerchantNetAmount)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<MerchantWallet>()
            .Property(w => w.PendingBalance)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<MerchantWallet>()
            .Property(w => w.AvailableBalance)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<MerchantWallet>()
            .Property(w => w.TotalWithdrawn)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<WalletTransaction>()
            .Property(t => t.Amount)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<WalletTransaction>()
            .Property(t => t.PendingBefore)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<WalletTransaction>()
            .Property(t => t.PendingAfter)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<WalletTransaction>()
            .Property(t => t.AvailableBefore)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<WalletTransaction>()
            .Property(t => t.AvailableAfter)
            .HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Invoice>().Property(i => i.SubTotal).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Invoice>().Property(i => i.VatRate).HasColumnType("decimal(5,4)");
        modelBuilder.Entity<Invoice>().Property(i => i.VatAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Invoice>().Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<Invoice>()
            .Property(i => i.ShippingAmount)
            .HasColumnType("decimal(18,2)");
        modelBuilder
            .Entity<AccountingEntry>()
            .Property(a => a.Amount)
            .HasColumnType("decimal(18,2)");

        // ── Site Settings ─────────────────────────────────────────────────────
        // HeroSettings is a single-row config — enforce via unique index on Id and
        // seed the default record so it always exists.
        modelBuilder.Entity<HeroSettings>().HasKey(h => h.Id);

        modelBuilder.Entity<HeroSettings>().Property(h => h.Tags).HasColumnType("jsonb");

        modelBuilder
            .Entity<HeroSettings>()
            .HasData(
                new HeroSettings
                {
                    Id = 1,
                    BadgeText = "Next-Gen Commerce",
                    Headline = "Premium Marketplace\nMeets Fast Delivery.",
                    HeadlineAccent = "Marketplace",
                    Subtitle =
                        "We redefine digital commerce with independent stores and an integrated courier engine — everything under one roof.",
                    SearchPlaceholder = "Search products, stores...",
                    PrimaryCtaText = "Search",
                    PrimaryCtaHref = "/products",
                    Tags = ["Electronics", "Fashion", "Home & Living", "Fast Delivery"],
                    IsActive = true,
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
            );

        modelBuilder.Entity<AnnouncementItem>().HasIndex(a => a.SortOrder);

        // Seed default announcements so the bar is populated on first run
        modelBuilder
            .Entity<AnnouncementItem>()
            .HasData(
                new AnnouncementItem
                {
                    Id = new Guid("11111111-0000-0000-0000-000000000001"),
                    Text = "Free shipping on orders over $500 — ",
                    CtaText = "Shop now",
                    CtaUrl = "/products",
                    IsActive = true,
                    SortOrder = 0,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new AnnouncementItem
                {
                    Id = new Guid("11111111-0000-0000-0000-000000000002"),
                    Text = "New sellers welcome! Start your store today — ",
                    CtaText = "Apply now",
                    CtaUrl = "/auth/apply-merchant",
                    IsActive = true,
                    SortOrder = 1,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new AnnouncementItem
                {
                    Id = new Guid("11111111-0000-0000-0000-000000000003"),
                    Text = "Flash deals updated daily — ",
                    CtaText = "See today's deals",
                    CtaUrl = "/deals",
                    IsActive = true,
                    SortOrder = 2,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
            );

        // ── Global query filters ──────────────────────────────────────────────
        // Deleted products and inactive merchants are hidden from all standard queries.
        // Use .IgnoreQueryFilters() in admin-scoped queries.
        modelBuilder.Entity<Product>().HasQueryFilter(p => !p.IsDeleted && p.Merchant.IsActive);

        // ── CommissionRule ────────────────────────────────────────────────────
        modelBuilder
            .Entity<CommissionRule>()
            .HasIndex(r => new
            {
                r.MerchantId,
                r.CategoryId,
                r.PlanType,
                r.Priority,
            });

        // ── WithdrawalRequest ─────────────────────────────────────────────────
        modelBuilder.Entity<WithdrawalRequest>().HasIndex(w => new { w.MerchantId, w.Status });
        modelBuilder.Entity<WithdrawalRequest>().Property(w => w.Status).HasConversion<string>();

        // ── ReturnRequest ─────────────────────────────────────────────────────
        modelBuilder.Entity<ReturnRequest>().HasIndex(r => new { r.OrderId });
        modelBuilder.Entity<ReturnRequest>().HasIndex(r => new { r.MerchantId, r.Status });
        modelBuilder.Entity<ReturnRequest>().Property(r => r.Status).HasConversion<string>();

        // ── Dispute ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Dispute>().HasIndex(d => new { d.OrderId });
        modelBuilder.Entity<Dispute>().HasIndex(d => new { d.MerchantId, d.Status });
        modelBuilder.Entity<Dispute>().Property(d => d.Status).HasConversion<string>();
        modelBuilder.Entity<Dispute>().Property(d => d.Reason).HasConversion<string>();
        modelBuilder.Entity<Product>().Property(p => p.ModerationStatus).HasConversion<string>();
    }
}
