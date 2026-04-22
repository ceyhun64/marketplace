using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController(
    AppDbContext db,
    ICurrentUserService currentUser,
    IFulfillmentService fulfillmentService
) : ControllerBase
{
    // ─── CUSTOMER ──────────────────────────────────────────────

    [HttpPost]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        var productIds = dto.Items.Select(i => i.ProductId).ToList();

        var products = await db
            .Products.Include(p => p.Merchant)
            .Where(p => productIds.Contains(p.Id) && p.Stock > 0 && !p.IsDeleted)
            .ToListAsync();

        if (products.Count != dto.Items.Count)
            return BadRequest(new { message = "Bazı ürünler bulunamadı veya stok yetersiz." });

        decimal total = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in dto.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);

            if (product.Stock < item.Quantity)
                return BadRequest(new { message = $"'{product.Name}' için yeterli stok yok." });

            orderItems.Add(
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    MerchantId = product.MerchantId,
                    ProductName = product.Name,
                    ProductImage = product.Images.FirstOrDefault(),
                    UnitPrice = product.Price,
                    Quantity = item.Quantity,
                }
            );

            total += product.Price * item.Quantity;
            product.Stock -= item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = currentUser.UserId,
            Source = Enum.Parse<OrderSource>(dto.Source),
            Status = OrderStatus.Pending,
            TotalAmount = total,
            ShippingRate = Enum.Parse<ShippingRate>(dto.ShippingRate),
            RecipientName = dto.ShippingAddress.FullName,
            RecipientPhone = dto.ShippingAddress.Phone,
            AddressLine = dto.ShippingAddress.AddressLine,
            City = dto.ShippingAddress.City,
            District = dto.ShippingAddress.District,
            PostalCode = dto.ShippingAddress.PostalCode,
            Items = orderItems,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetOrder),
            new { id = order.Id },
            new { orderId = order.Id, totalAmount = total }
        );
    }

    [HttpGet]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10
    )
    {
        var query = db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Shipment)
            .Where(o => o.CustomerId == currentUser.UserId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var ps))
            query = query.Where(o => o.Status == ps);

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = orders.Select(MapOrderToDto),
                pagination = new
                {
                    page,
                    limit,
                    total,
                    pages = (int)Math.Ceiling((double)total / limit),
                },
            }
        );
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var order = await db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Category)
            .Include(o => o.Shipment)
                .ThenInclude(s => s!.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound();

        if (currentUser.Role == "Customer" && order.CustomerId != currentUser.UserId)
            return Forbid();

        if (currentUser.Role == "Merchant")
        {
            if (!order.Items.Any(i => i.MerchantId == currentUser.MerchantId))
                return Forbid();
        }

        return Ok(MapOrderToDto(order));
    }

    [HttpGet("{id:guid}/tracking")]
    public async Task<IActionResult> GetTracking(Guid id)
    {
        var order = await db
            .Orders.Include(o => o.Shipment)
                .ThenInclude(s => s!.StatusHistory)
            .Include(o => o.Shipment)
                .ThenInclude(s => s!.Courier)
                    .ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound();

        if (currentUser.Role == "Customer" && order.CustomerId != currentUser.UserId)
            return Forbid();

        var shipment = order.Shipment;
        if (shipment == null)
            return Ok(
                new
                {
                    orderId = id,
                    orderStatus = order.Status.ToString(),
                    shipment = (object?)null,
                }
            );

        return Ok(
            new OrderTrackingDto
            {
                OrderId = id,
                OrderStatus = order.Status.ToString(),
                TrackingNumber = shipment.TrackingNumber,
                ShipmentStatus = shipment.Status.ToString(),
                EstimatedDelivery = shipment.EstimatedDelivery,
                CourierName =
                    shipment.Courier?.User != null
                        ? $"{shipment.Courier.User.FirstName} {shipment.Courier.User.LastName}".Trim()
                        : null,
                CourierPhone = shipment.Courier?.User?.Phone,
                StatusHistory = shipment
                    .StatusHistory.OrderByDescending(h => h.ChangedAt)
                    .Select(h => new ShipmentStatusHistoryDto
                    {
                        Status = h.Status.ToString(),
                        Note = h.Note,
                        ChangedAt = h.ChangedAt,
                    })
                    .ToList(),
            }
        );
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> CancelOrder(Guid id, [FromBody] CancelOrderDto dto)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o =>
            o.Id == id && o.CustomerId == currentUser.UserId
        );

        if (order == null)
            return NotFound();

        if (!new[] { OrderStatus.Pending, OrderStatus.PaymentConfirmed }.Contains(order.Status))
            return BadRequest(new { message = "Bu aşamada sipariş iptal edilemez." });

        order.Status = OrderStatus.Cancelled;
        order.CancellationReason = dto.Reason;
        order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new { message = "Sipariş iptal edildi." });
    }

    // ─── ADMIN ─────────────────────────────────────────────────

    [HttpGet("admin/all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] string? status,
        [FromQuery] Guid? merchantId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var query = db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Shipment)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var ps))
            query = query.Where(o => o.Status == ps);

        if (merchantId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.MerchantId == merchantId.Value));

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = orders.Select(MapOrderToDto),
                pagination = new
                {
                    page,
                    limit,
                    total,
                    pages = (int)Math.Ceiling((double)total / limit),
                },
            }
        );
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusDto dto)
    {
        var order = await db.Orders.FindAsync(id);
        if (order == null)
            return NotFound();

        if (!Enum.TryParse<OrderStatus>(dto.Status, out var newStatus))
            return BadRequest(new { message = "Geçersiz sipariş durumu." });

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Sipariş durumu güncellendi.", status = newStatus.ToString() });
    }

    // ─── HELPER ────────────────────────────────────────────────

    private static OrderDto MapOrderToDto(Order order) =>
        new()
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            Source = order.Source.ToString(),
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ShippingRate = order.ShippingRate.ToString(),
            PaymentId = order.PaymentId,
            ShippingAddress = new ShippingAddressDto
            {
                FullName = order.RecipientName,
                Phone = order.RecipientPhone,
                AddressLine = order.AddressLine,
                City = order.City,
                District = order.District,
                PostalCode = order.PostalCode,
            },
            Items = order
                .Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    ProductImageUrl = i.ProductImage,
                    MerchantId = i.MerchantId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    SubTotal = i.UnitPrice * i.Quantity,
                })
                .ToList(),
            Shipment =
                order.Shipment == null
                    ? null
                    : new ShipmentSummaryDto
                    {
                        Id = order.Shipment.Id,
                        Status = order.Shipment.Status.ToString(),
                        TrackingNumber = order.Shipment.TrackingNumber,
                        EstimatedDelivery = order.Shipment.EstimatedDelivery,
                        LabelUrl = order.Shipment.LabelUrl,
                    },
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
        };
}
