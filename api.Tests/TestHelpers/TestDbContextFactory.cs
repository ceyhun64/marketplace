using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.InMemory.Diagnostics.Internal;

namespace api.Tests.TestHelpers;

/// <summary>
/// InMemory AppDbContext factory.
///
/// Gerçek PostgreSQL konfigürasyonunun InMemory provider ile uyumsuz olan
/// özelliklerini (NpgsqlTsVector, full-text GIN index vb.) atlar.
/// Üretim koduna dokunmadan tüm handler/controller testlerinde kullanılır.
/// </summary>
internal static class TestDbContextFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            // InMemory provider transactions'ı desteklemez; uyarıyı baskıla.
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new InMemoryAppDbContext(options);
    }
}

/// <summary>
/// AppDbContext alt sınıfı — yalnızca test projesinde kullanılır.
/// OnModelCreating'de PostgreSQL-spesifik tip/index yapılandırmalarını
/// InMemory uyumlu hale getirir.
/// </summary>
internal sealed class InMemoryAppDbContext : AppDbContext
{
    public InMemoryAppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // NpgsqlTsVector (full-text search) InMemory provider tarafından
        // desteklenmez; test ortamında bu sütunu yok sayıyoruz.
        modelBuilder.Entity<Product>().Ignore(p => p.SearchVector);
    }
}
