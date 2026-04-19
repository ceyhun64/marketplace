using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using AutoMapper;
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
    IFulfillmentService fulfillmentService,
    IMapper mapper
) : ControllerBase
{
    // ─── CUSTOMER ──────────────────────────────────────────────

    /// <summary>Sipariş oluştur (checkout)</summary>
    [HttpPost]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        var offerIds = dto.Items.Select(i => i.OfferId).ToList();
        var offers = await db
            .ProductOffers.Include(o => o.Product)
            .Include(o => o.Merchant)
            .Where(o => offerIds.Contains(o.Id) && o.Stock > 0)
            .ToListAsync();

        if (offers.Count != dto.Items.Count)
            return BadRequest(new { message = "Bazı teklifler bulunamadı veya stok yetersiz." });

        decimal total = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in dto.Items)
        {
            var offer = offers.First(o => o.Id == item.OfferId);

            if (offer.Stock < item.Quantity)
                return BadRequest(
                    new { message = $"'{offer.Product.Name}' için yeterli stok yok." }
                );

            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OfferId = offer.Id,
                Quantity = item.Quantity,
                UnitPrice = offer.Price,
            };

            total += offer.Price * item.Quantity;
            orderItems.Add(orderItem);

            offer.Stock -= item.Quantity;
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

    /// <summary>Kendi siparişlerim</summary>
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
                .ThenInclude(i => i.Offer)
                    .ThenInclude(o => o.Product)
            .Include(o => o.Shipment)
            .Where(o => o.CustomerId == currentUser.UserId);

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<OrderStatus>(status, out var parsedStatus)
        )
            query = query.Where(o => o.Status == parsedStatus);

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = orders.Select(o => MapOrderToDto(o)),
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

    /// <summary>Sipariş detayı</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var order = await db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Offer)
                    .ThenInclude(o => o.Product)
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
            var hasMerchantItem = order.Items.Any(i =>
                i.Offer.MerchantId == currentUser.MerchantId
            );
            if (!hasMerchantItem)
                return Forbid();
        }

        return Ok(MapOrderToDto(order));
    }

    /// <summary>Canlı kargo takip</summary>
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
                    shipment.Courier?.User?.FirstName + " " + shipment.Courier?.User?.LastName,
                CourierPhone = shipment.Courier?.User?.Phone,
                // ✅ Doğru
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

    /// <summary>Sipariş iptal</summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> CancelOrder(Guid id, [FromBody] CancelOrderDto dto)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o =>
            o.Id == id && o.CustomerId == currentUser.UserId
        );
        if (order == null)
            return NotFound();

        var cancellableStatuses = new[] { OrderStatus.Pending, OrderStatus.PaymentConfirmed };
        if (!cancellableStatuses.Contains(order.Status))
            return BadRequest(new { message = "Bu aşamada sipariş iptal edilemez." });

        order.Status = OrderStatus.Cancelled;
        order.CancellationReason = dto.Reason;
        order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new { message = "Sipariş iptal edildi." });
    }

    // ─── MERCHANT ──────────────────────────────────────────────

    /// <summary>Merchant'a gelen siparişler</summary>
    [HttpGet("merchant/incoming")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMerchantOrders(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10
    )
    {
        var query = db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Offer)
                    .ThenInclude(o => o.Product)
            .Include(o => o.Shipment)
            .Where(o => o.Items.Any(i => i.Offer.MerchantId == currentUser.MerchantId));

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<OrderStatus>(status, out var parsedStatus)
        )
            query = query.Where(o => o.Status == parsedStatus);

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = orders.Select(o => MapOrderToDto(o)),
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

    /// <summary>Merchant: sipariş hazırlandı</summary>
    [HttpPatch("{id:guid}/pack")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> MarkAsPacked(Guid id)
    {
        var order = await db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Offer)
            .FirstOrDefaultAsync(o =>
                o.Id == id && o.Items.Any(i => i.Offer.MerchantId == currentUser.MerchantId)
            );

        if (order == null)
            return NotFound();

        if (order.Status != OrderStatus.PaymentConfirmed)
            return BadRequest(new { message = "Yalnızca ödeme onaylı siparişler hazırlanabilir." });

        order.Status = OrderStatus.LabelGenerated;
        order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new { message = "Sipariş hazırlandı olarak işaretlendi." });
    }

    // ─── ADMIN ─────────────────────────────────────────────────

    /// <summary>Tüm siparişler (Admin)</summary>
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
                .ThenInclude(i => i.Offer)
                    .ThenInclude(o => o.Product)
            .Include(o => o.Shipment)
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<OrderStatus>(status, out var parsedStatus)
        )
            query = query.Where(o => o.Status == parsedStatus);

        if (merchantId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.Offer.MerchantId == merchantId.Value));

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = orders.Select(o => MapOrderToDto(o)),
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

    /// <summary>Sipariş durumu güncelle (Admin)</summary>
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

    // ─── HELPERS ───────────────────────────────────────────────

    private static OrderDto MapOrderToDto(Order order)
    {
        var addr = new ShippingAddressDto
        {
            FullName = order.RecipientName,
            Phone = order.RecipientPhone,
            AddressLine = order.AddressLine,
            City = order.City,
            District = order.District,
            PostalCode = order.PostalCode,
        };

        return new OrderDto
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            Source = order.Source.ToString(),
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ShippingRate = order.ShippingRate.ToString(),
            PaymentId = order.PaymentId,
            ShippingAddress = addr,
            Items = order
                .Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    OfferId = i.OfferId,
                    ProductName = i.Offer?.Product?.Name ?? "",
                    ProductImageUrl = i.Offer?.Product?.Images?.FirstOrDefault(),
                    MerchantStoreName = i.Offer?.Merchant?.StoreName ?? "",
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
}
