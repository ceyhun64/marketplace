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
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentStatusHistory> ShipmentStatusHistories => Set<ShipmentStatusHistory>();
    public DbSet<Courier> Couriers => Set<Courier>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<AccountingEntry> AccountingEntries => Set<AccountingEntry>();
    public DbSet<Plugin> Plugins => Set<Plugin>();
    public DbSet<MerchantPlugin> MerchantPlugins => Set<MerchantPlugin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Unique indexler ──────────────────────────────────────────────────
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<MerchantProfile>().HasIndex(m => m.Slug).IsUnique();
        modelBuilder.Entity<Shipment>().HasIndex(s => s.TrackingNumber).IsUnique();
        modelBuilder.Entity<Invoice>().HasIndex(i => i.InvoiceNumber).IsUnique();

        // ── Enum → string ────────────────────────────────────────────────────
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.Source).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.ShippingRate).HasConversion<string>();
        modelBuilder.Entity<Shipment>().Property(s => s.Status).HasConversion<string>();
        modelBuilder
            .Entity<ShipmentStatusHistory>()
            .Property(h => h.Status)
            .HasConversion<string>();

        // ── Subscription → MerchantProfile (1:1) ────────────────────────────
        modelBuilder
            .Entity<Subscription>()
            .HasOne(s => s.Merchant)
            .WithOne(m => m.Subscription)
            .HasForeignKey<Subscription>(s => s.MerchantId);

        // ── MerchantProfile → Products (1:N) ─────────────────────────────────
        modelBuilder
            .Entity<Product>()
            .HasOne(p => p.Merchant)
            .WithMany(m => m.Products)
            .HasForeignKey(p => p.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Category self-referencing ────────────────────────────────────────
        modelBuilder
            .Entity<Category>()
            .HasMany(c => c.SubCategories)
            .WithOne(c => c.Parent)
            .HasForeignKey(c => c.ParentId);

        // ── Order → OrderItems (1:N) ─────────────────────────────────────────
        modelBuilder
            .Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

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

        // ── Invoice → AccountingEntries (1:N) ────────────────────────────────
        modelBuilder
            .Entity<AccountingEntry>()
            .HasOne(a => a.Invoice)
            .WithMany(i => i.AccountingEntries)
            .HasForeignKey(a => a.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── AccountingEntry → Order (N:1) ─────────────────────────────────────
        modelBuilder
            .Entity<AccountingEntry>()
            .HasOne(a => a.Order)
            .WithMany()
            .HasForeignKey(a => a.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── AccountingEntry → MerchantProfile (N:1) ──────────────────────────
        modelBuilder
            .Entity<AccountingEntry>()
            .HasOne(a => a.Merchant)
            .WithMany()
            .HasForeignKey(a => a.MerchantId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Invoice → MerchantProfile (N:1) ──────────────────────────────────
        modelBuilder
            .Entity<Invoice>()
            .HasOne(i => i.Merchant)
            .WithMany()
            .HasForeignKey(i => i.MerchantId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Invoice → Customer/User (N:1) ─────────────────────────────────────
        modelBuilder
            .Entity<Invoice>()
            .HasOne(i => i.Customer)
            .WithMany()
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Plugin → MerchantPlugin (1:N) ────────────────────────────────────
        modelBuilder
            .Entity<MerchantPlugin>()
            .HasOne(mp => mp.Plugin)
            .WithMany(p => p.MerchantPlugins)
            .HasForeignKey(mp => mp.PluginId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── MerchantProfile → MerchantPlugin (1:N) ───────────────────────────
        modelBuilder
            .Entity<MerchantPlugin>()
            .HasOne(mp => mp.Merchant)
            .WithMany()
            .HasForeignKey(mp => mp.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Shipment → ShipmentStatusHistory (1:N) ───────────────────────────
        modelBuilder
            .Entity<Shipment>()
            .HasMany(s => s.StatusHistory)
            .WithOne(h => h.Shipment)
            .HasForeignKey(h => h.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Shipment → Courier (N:1, nullable) ──────────────────────────────
        modelBuilder
            .Entity<Shipment>()
            .HasOne(s => s.Courier)
            .WithMany(c => c.Shipments)
            .HasForeignKey(s => s.CourierId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Courier → User (1:1) ─────────────────────────────────────────────
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
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── decimal precision ─────────────────────────────────────────────────
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Order>().Property(o => o.ShippingAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<OrderItem>().Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Product>().Property(p => p.Price).HasColumnType("decimal(18,2)");
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

        // ── Soft-delete filtresi ──────────────────────────────────────────────
        modelBuilder.Entity<Product>().HasQueryFilter(p => !p.IsDeleted);
    }
}
