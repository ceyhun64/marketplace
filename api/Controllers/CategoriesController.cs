using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    // ── PUBLIC ──────────────────────────────────────────────────────────────

    /// <summary>Tüm kategoriler — ağaç yapısı (sadece kök kategoriler + alt kategoriler)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var all = await _db
            .Categories.Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        // Sadece kök kategorileri al, alt kategorileri iç içe yerleştir
        var roots = all.Where(c => c.ParentId == null).Select(c => MapCategory(c, all)).ToList();

        return Ok(roots);
    }

    /// <summary>Kategori detayı + ürünleri (slug ile)</summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(
        string slug,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var category = await _db
            .Categories.Include(c => c.SubCategories!.Where(sc => !sc.IsDeleted))
            .FirstOrDefaultAsync(c => c.Slug == slug && !c.IsDeleted);

        if (category == null)
            return NotFound(new { message = "Kategori bulunamadı." });

        // Bu kategoriye + alt kategorilere ait ürünler
        var categoryIds = await GetCategoryIdsRecursiveAsync(category.Id);

        var products = await _db
            .Products.Include(p => p.Offers.Where(o => o.PublishToMarket && o.Stock > 0))
            .Where(p => !p.IsDeleted && categoryIds.Contains(p.CategoryId))
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                BestPrice = p.Offers.Where(o => o.PublishToMarket).Min(o => (decimal?)o.Price),
                OfferCount = p.Offers.Count(o => o.PublishToMarket && o.Stock > 0),
            })
            .ToListAsync();

        return Ok(
            new
            {
                category = new
                {
                    category.Id,
                    category.Name,
                    category.Slug,
                    category.IconUrl,
                },
                SubCategories = category.SubCategories?.Select(sc => new
                {
                    sc.Id,
                    sc.Name,
                    sc.Slug,
                }),
                products,
            }
        );
    }

    /// <summary>Alt kategoriler</summary>
    [HttpGet("{id:guid}/subcategories")]
    public async Task<IActionResult> GetSubcategories(Guid id)
    {
        var subs = await _db
            .Categories.Where(c => c.ParentId == id && !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.IconUrl,
            })
            .ToListAsync();

        return Ok(subs);
    }

    // ── ADMIN ───────────────────────────────────────────────────────────────

    /// <summary>Kategori oluştur — Admin</summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CategoryDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Slug benzersizliği
        var slugExists = await _db.Categories.AnyAsync(c => c.Slug == dto.Slug && !c.IsDeleted);
        if (slugExists)
            return BadRequest(new { message = "Bu slug zaten kullanımda." });

        // Parent kontrolü
        if (dto.ParentId.HasValue)
        {
            var parentExists = await _db.Categories.AnyAsync(c =>
                c.Id == dto.ParentId && !c.IsDeleted
            );
            if (!parentExists)
                return BadRequest(new { message = "Üst kategori bulunamadı." });
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = dto.Slug,
            ParentId = dto.ParentId,
            IconUrl = dto.IconUrl,
            SortOrder = dto.SortOrder ?? 0,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBySlug), new { slug = category.Slug }, category);
    }

    /// <summary>Kategori güncelle — Admin</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CategoryDto dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null || category.IsDeleted)
            return NotFound();

        // Slug değiştiyse benzersizlik kontrolü
        if (category.Slug != dto.Slug)
        {
            var slugExists = await _db.Categories.AnyAsync(c =>
                c.Slug == dto.Slug && c.Id != id && !c.IsDeleted
            );
            if (slugExists)
                return BadRequest(new { message = "Bu slug zaten kullanımda." });
        }

        category.Name = dto.Name;
        category.Slug = dto.Slug;
        category.ParentId = dto.ParentId;
        category.IconUrl = dto.IconUrl;
        category.SortOrder = dto.SortOrder ?? category.SortOrder;

        await _db.SaveChangesAsync();
        return Ok(category);
    }

    /// <summary>Kategori sil (soft-delete) — Admin</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null || category.IsDeleted)
            return NotFound();

        // Alt kategorisi varsa uyar
        var hasChildren = await _db.Categories.AnyAsync(c => c.ParentId == id && !c.IsDeleted);
        if (hasChildren)
            return BadRequest(
                new
                {
                    message = "Bu kategorinin alt kategorileri var. Önce onları silin veya taşıyın.",
                }
            );

        // Bu kategoriye ürün bağlıysa uyar
        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id && !p.IsDeleted);
        if (hasProducts)
            return BadRequest(
                new
                {
                    message = "Bu kategoriye ait ürünler mevcut. Önce ürünleri başka kategoriye taşıyın.",
                }
            );

        category.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── HELPERS ─────────────────────────────────────────────────────────────

    private static object MapCategory(Category c, List<Category> all) =>
        new
        {
            c.Id,
            c.Name,
            c.Slug,
            c.IconUrl,
            c.SortOrder,
            SubCategories = all.Where(sc => sc.ParentId == c.Id)
                .OrderBy(sc => sc.SortOrder)
                .Select(sc => MapCategory(sc, all))
                .ToList(),
        };

    private async Task<List<Guid>> GetCategoryIdsRecursiveAsync(Guid rootId)
    {
        var all = await _db.Categories.Where(c => !c.IsDeleted).ToListAsync();
        var result = new List<Guid> { rootId };
        var queue = new Queue<Guid>();
        queue.Enqueue(rootId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var children = all.Where(c => c.ParentId == current).Select(c => c.Id).ToList();
            result.AddRange(children);
            foreach (var child in children)
                queue.Enqueue(child);
        }

        return result;
    }
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public record CategoryDto(
    string Name,
    string Slug,
    Guid? ParentId,
    string? IconUrl,
    int? SortOrder
);
