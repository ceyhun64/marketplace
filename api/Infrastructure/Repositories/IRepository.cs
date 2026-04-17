using System.Linq.Expressions;

namespace api.Infrastructure.Repositories;

/// <summary>
/// Generic repository interface — tüm entity'ler için temel CRUD operasyonları.
/// </summary>
public interface IRepository<T> where T : class
{
    // ── READ ─────────────────────────────────────────────────────────────────

    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken ct = default);

    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);

    Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken ct = default);

    Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken ct = default);

    Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken ct = default);

    IQueryable<T> Query();

    // ── WRITE ────────────────────────────────────────────────────────────────

    Task AddAsync(T entity, CancellationToken ct = default);

    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);

    void Update(T entity);

    void Remove(T entity);

    void RemoveRange(IEnumerable<T> entities);

    // ── PAGINATION ───────────────────────────────────────────────────────────

    Task<(IReadOnlyList<T> Items, int TotalCount)> GetPagedAsync(
        int page,
        int limit,
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken ct = default);
}
