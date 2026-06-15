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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var all = await _db.Categories
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        var productCounts = await _db.Products
            .Where(p => !p.IsDeleted)
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

        var roots = all
            .Where(c => c.ParentId == null)
            .Select(c => MapCategory(c, all, productCounts))
            .ToList();

        return Ok(roots);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(
        string slug,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var category = await _db.Categories
            .Include(c => c.SubCategories!.Where(sc => !sc.IsDeleted))
            .FirstOrDefaultAsync(c => c.Slug == slug && !c.IsDeleted);

        if (category == null)
            return NotFound(new { message = "Kategori bulunamadı." });

        var categoryIds = await GetCategoryIdsRecursiveAsync(category.Id);

        var products = await _db.Products
            .Include(p => p.Merchant)
            .Where(p => !p.IsDeleted && p.IsApproved && categoryIds.Contains(p.CategoryId) && (p.Stock > 0 || p.Variants.Any(v => v.IsActive && v.Stock > 0)))
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Images,
                p.Price,
                p.Stock,
                MerchantStoreName = p.Merchant.StoreName,
                MerchantSlug = p.Merchant.Slug,
            })
            .ToListAsync();

        return Ok(new
        {
            category = new
            {
                category.Id,
                category.Name,
                category.Slug,
                category.IconUrl,
                category.ParentId,
            },
            SubCategories = category.SubCategories?.Select(sc => new
            {
                sc.Id,
                sc.Name,
                sc.Slug,
                sc.IconUrl,
            }),
            products,
        });
    }

    [HttpGet("{id:guid}/subcategories")]
    public async Task<IActionResult> GetSubcategories(Guid id)
    {
        var subs = await _db.Categories
            .Where(c => c.ParentId == id && !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new { c.Id, c.Name, c.Slug, c.IconUrl })
            .ToListAsync();

        return Ok(subs);
    }

    // ── ADMIN ───────────────────────────────────────────────────────────────

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CategoryDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var slugExists = await _db.Categories.AnyAsync(c => c.Slug == dto.Slug && !c.IsDeleted);
        if (slugExists)
            return BadRequest(new { message = "This slug is already in use." });

        if (dto.ParentId.HasValue)
        {
            var parentExists = await _db.Categories.AnyAsync(c =>
                c.Id == dto.ParentId.Value && !c.IsDeleted && c.ParentId == null);
            if (!parentExists)
                return BadRequest(new { message = "Parent category not found or is not a root category." });
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

        return CreatedAtAction(nameof(GetBySlug), new { slug = category.Slug }, new
        {
            category.Id,
            category.Name,
            category.Slug,
            category.IconUrl,
            category.SortOrder,
            category.ParentId,
            ProductCount = 0,
            SubCategories = Array.Empty<object>(),
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CategoryDto dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null || category.IsDeleted)
            return NotFound();

        if (category.Slug != dto.Slug)
        {
            var slugExists = await _db.Categories.AnyAsync(c =>
                c.Slug == dto.Slug && c.Id != id && !c.IsDeleted);
            if (slugExists)
                return BadRequest(new { message = "This slug is already in use." });
        }

        if (dto.ParentId.HasValue)
        {
            if (dto.ParentId.Value == id)
                return BadRequest(new { message = "A category cannot be its own parent." });

            var descendants = await GetCategoryIdsRecursiveAsync(id);
            if (descendants.Contains(dto.ParentId.Value))
                return BadRequest(new { message = "Cannot create a circular category reference." });

            var parent = await _db.Categories.FirstOrDefaultAsync(c =>
                c.Id == dto.ParentId.Value && !c.IsDeleted);
            if (parent == null)
                return BadRequest(new { message = "Parent category not found." });

            if (parent.ParentId != null)
                return BadRequest(new { message = "Only root categories can be used as parents (max 2 levels)." });
        }

        category.Name = dto.Name;
        category.Slug = dto.Slug;
        category.ParentId = dto.ParentId;
        category.IconUrl = dto.IconUrl;
        category.SortOrder = dto.SortOrder ?? category.SortOrder;

        await _db.SaveChangesAsync();
        return Ok(new
        {
            category.Id,
            category.Name,
            category.Slug,
            category.IconUrl,
            category.SortOrder,
            category.ParentId,
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null || category.IsDeleted)
            return NotFound();

        var hasChildren = await _db.Categories.AnyAsync(c => c.ParentId == id && !c.IsDeleted);
        if (hasChildren)
            return BadRequest(new
            {
                message = "This category has subcategories. Delete or move them first.",
            });

        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id && !p.IsDeleted);
        if (hasProducts)
            return BadRequest(new
            {
                message = "This category has products assigned to it. Move them to another category first.",
            });

        category.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── HELPERS ─────────────────────────────────────────────────────────────

    private static object MapCategory(
        Category c,
        List<Category> all,
        Dictionary<Guid, int> productCounts) =>
        new
        {
            c.Id,
            c.Name,
            c.Slug,
            c.IconUrl,
            c.SortOrder,
            c.ParentId,
            ProductCount = productCounts.GetValueOrDefault(c.Id, 0),
            SubCategories = all
                .Where(sc => sc.ParentId == c.Id)
                .OrderBy(sc => sc.SortOrder)
                .ThenBy(sc => sc.Name)
                .Select(sc => MapCategory(sc, all, productCounts))
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
