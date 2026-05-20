using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Customer wishlist CRUD.
/// All endpoints require the Customer or Admin role.
/// </summary>
[ApiController]
[Route("api/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public WishlistController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // ── GET /api/wishlist — Customer's wishlist ────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetMyWishlist()
    {
        var userId = _currentUser.UserId;

        var items = await _db.WishlistItems
            .Where(w => w.CustomerId == userId)
            .Include(w => w.Product)
                .ThenInclude(p => p.Merchant)
            .Include(w => w.Product)
                .ThenInclude(p => p.Category)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new
            {
                w.Id,
                w.ProductId,
                w.CreatedAt,
                Product = new
                {
                    w.Product.Id,
                    w.Product.Name,
                    w.Product.Images,
                    w.Product.Price,
                    w.Product.Stock,
                    Category = w.Product.Category == null ? null : w.Product.Category.Name,
                    Merchant = new
                    {
                        w.Product.Merchant.StoreName,
                        w.Product.Merchant.Slug,
                    },
                },
            })
            .ToListAsync();

        return Ok(new { total = items.Count, items });
    }

    // ── POST /api/wishlist/{productId} — Add product ──────────────────────────

    [HttpPost("{productId:guid}")]
    public async Task<IActionResult> AddToWishlist(Guid productId)
    {
        var userId = _currentUser.UserId;

        // Does the product exist?
        var product = await _db.Products.FindAsync(productId);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        // Already in the list?
        var exists = await _db.WishlistItems
            .AnyAsync(w => w.CustomerId == userId && w.ProductId == productId);

        if (exists)
            return Conflict(new { message = "This product is already in the wishlist." });

        var item = new WishlistItem
        {
            CustomerId = userId,
            ProductId = productId,
        };

        _db.WishlistItems.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyWishlist), new { id = item.Id }, new
        {
            item.Id,
            item.ProductId,
            item.CreatedAt,
        });
    }

    // ── DELETE /api/wishlist/{productId} — Remove product ────────────────────

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> RemoveFromWishlist(Guid productId)
    {
        var userId = _currentUser.UserId;

        var item = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.CustomerId == userId && w.ProductId == productId);

        if (item == null)
            return NotFound(new { message = "Product not found in the wishlist." });

        _db.WishlistItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── GET /api/wishlist/check/{productId} — Is product in list? ────────────

    [HttpGet("check/{productId:guid}")]
    public async Task<IActionResult> CheckWishlist(Guid productId)
    {
        var userId = _currentUser.UserId;
        var inWishlist = await _db.WishlistItems
            .AnyAsync(w => w.CustomerId == userId && w.ProductId == productId);
        return Ok(new { productId, inWishlist });
    }

    // ── DELETE /api/wishlist — Clear entire list ──────────────────────────────

    [HttpDelete]
    public async Task<IActionResult> ClearWishlist()
    {
        var userId = _currentUser.UserId;
        var items = await _db.WishlistItems
            .Where(w => w.CustomerId == userId)
            .ToListAsync();

        _db.WishlistItems.RemoveRange(items);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
