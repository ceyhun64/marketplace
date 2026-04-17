using api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

// EKSİK OLAN SATIR BURASI:
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
    public DbSet<Courier> Couriers => Set<Courier>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Plugin> Plugins => Set<Plugin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique indexler
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<MerchantProfile>().HasIndex(m => m.Slug).IsUnique();
        modelBuilder.Entity<Shipment>().HasIndex(s => s.TrackingNumber).IsUnique();
        // AppDbContext.cs OnModelCreating içine ekle:
        modelBuilder
            .Entity<Subscription>()
            .HasOne(s => s.Merchant)
            .WithOne(m => m.Subscription)
            .HasForeignKey<Subscription>(s => s.MerchantId);

        // Enum → string dönüşümleri
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Source).HasConversion<string>();
        modelBuilder.Entity<Shipment>().Property(s => s.Status).HasConversion<string>();

        // Category self-referencing
        modelBuilder
            .Entity<Category>()
            .HasMany(c => c.SubCategories)
            .WithOne(c => c.Parent)
            .HasForeignKey(c => c.ParentId);

        // Soft-delete filtresi
        modelBuilder.Entity<ProductOffer>().HasQueryFilter(o => !o.IsDeleted);
    }
}
