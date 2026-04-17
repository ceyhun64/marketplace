using System.Linq.Expressions;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Repositories;

/// <summary>
/// EF Core generic repository implementasyonu.
/// Unit of Work pattern: SaveChanges çağrısı dışarıdan (Controller/Handler) yapılır.
/// </summary>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _db;
    protected readonly DbSet<T> _set;

    public Repository(AppDbContext db)
    {
        _db = db;
        _set = db.Set<T>();
    }

    // ── READ ─────────────────────────────────────────────────────────────────

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _set.FindAsync([id], ct);

    public async Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken ct = default)
        => await _set.FirstOrDefaultAsync(predicate, ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await _set.ToListAsync(ct);

    public async Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken ct = default)
        => await _set.Where(predicate).ToListAsync(ct);

    public async Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken ct = default)
        => await _set.AnyAsync(predicate, ct);

    public async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken ct = default)
        => predicate is null
            ? await _set.CountAsync(ct)
            : await _set.CountAsync(predicate, ct);

    public IQueryable<T> Query() => _set.AsQueryable();

    // ── WRITE ────────────────────────────────────────────────────────────────

    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await _set.AddAsync(entity, ct);

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
        => await _set.AddRangeAsync(entities, ct);

    public void Update(T entity)
        => _set.Update(entity);

    public void Remove(T entity)
        => _set.Remove(entity);

    public void RemoveRange(IEnumerable<T> entities)
        => _set.RemoveRange(entities);

    // ── PAGINATION ───────────────────────────────────────────────────────────

    public async Task<(IReadOnlyList<T> Items, int TotalCount)> GetPagedAsync(
        int page,
        int limit,
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken ct = default)
    {
        var query = _set.AsQueryable();

        if (predicate is not null)
            query = query.Where(predicate);

        var totalCount = await query.CountAsync(ct);

        if (orderBy is not null)
            query = orderBy(query);

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
