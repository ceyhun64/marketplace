using api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<MerchantProfile> MerchantProfiles => Set<MerchantProfile>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductOffer> ProductOffers => Set<ProductOffer>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentStatusHistory> ShipmentStatusHistories => Set<ShipmentStatusHistory>(); // ← EKLENDİ
    public DbSet<Courier> Couriers => Set<Courier>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Plugin> Plugins => Set<Plugin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Unique indexler ───────────────────────────────────────────────────
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<MerchantProfile>().HasIndex(m => m.Slug).IsUnique();
        modelBuilder.Entity<Shipment>().HasIndex(s => s.TrackingNumber).IsUnique();

        // ── Subscription → MerchantProfile (1:1) ─────────────────────────────
        modelBuilder
            .Entity<Subscription>()
            .HasOne(s => s.Merchant)
            .WithOne(m => m.Subscription)
            .HasForeignKey<Subscription>(s => s.MerchantId);

        // ── Enum → string dönüşümleri ─────────────────────────────────────────
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Source).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.ShippingRate).HasConversion<string>(); // ← EKLENDİ
        modelBuilder.Entity<Shipment>().Property(s => s.Status).HasConversion<string>();
        modelBuilder
            .Entity<ShipmentStatusHistory>()
            .Property(h => h.Status)
            .HasConversion<string>(); // ← EKLENDİ

        // ── Category self-referencing ─────────────────────────────────────────
        modelBuilder
            .Entity<Category>()
            .HasMany(c => c.SubCategories)
            .WithOne(c => c.Parent)
            .HasForeignKey(c => c.ParentId);

        // ── Order → OrderItems (1:N) ──────────────────────────────────────────
        modelBuilder
            .Entity<Order>() // ← EKLENDİ
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Order → Shipment (1:1) ────────────────────────────────────────────
        modelBuilder
            .Entity<Order>() // ← EKLENDİ
            .HasOne(o => o.Shipment)
            .WithOne(s => s.Order)
            .HasForeignKey<Shipment>(s => s.OrderId);

        // ── Shipment → ShipmentStatusHistory (1:N) ────────────────────────────
        modelBuilder
            .Entity<Shipment>() // ← EKLENDİ
            .HasMany(s => s.StatusHistory)
            .WithOne(h => h.Shipment)
            .HasForeignKey(h => h.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Shipment → Courier (N:1, nullable) ────────────────────────────────
        modelBuilder
            .Entity<Shipment>() // ← EKLENDİ
            .HasOne(s => s.Courier)
            .WithMany()
            .HasForeignKey(s => s.CourierId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Courier → User (1:1) ──────────────────────────────────────────────
        modelBuilder
            .Entity<Courier>() // ← EKLENDİ
            .HasOne(c => c.User)
            .WithOne()
            .HasForeignKey<Courier>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── OrderItem → ProductOffer (N:1) ────────────────────────────────────
        modelBuilder
            .Entity<OrderItem>() // ← EKLENDİ
            .HasOne(i => i.Offer)
            .WithMany()
            .HasForeignKey(i => i.OfferId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── decimal precision ─────────────────────────────────────────────────
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)"); // ← EKLENDİ
        modelBuilder.Entity<OrderItem>().Property(i => i.UnitPrice).HasColumnType("decimal(18,2)"); // ← EKLENDİ
        modelBuilder.Entity<ProductOffer>().Property(o => o.Price).HasColumnType("decimal(18,2)"); // ← EKLENDİ

        // ── Soft-delete filtresi ───────────────────────────────────────────────
        modelBuilder.Entity<ProductOffer>().HasQueryFilter(o => !o.IsDeleted);
    }
}
