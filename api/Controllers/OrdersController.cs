using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;

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

        Order order = null!;
        List<OrderItem> orderItems = new();

        // Serializable isolation prevents race conditions — same stock cannot be allocated
        // to two concurrent orders.
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable);
        try
        {
            var products = await db
                .Products.Include(p => p.Merchant)
                .Where(p => productIds.Contains(p.Id) && !p.IsDeleted)
                .ToListAsync();

            if (products.Count != dto.Items.Count)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Some products were not found." });
            }

            decimal total = 0;

            foreach (var item in dto.Items)
            {
                var product = products.First(p => p.Id == item.ProductId);

                if (product.Stock < item.Quantity)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = $"Insufficient stock for '{product.Name}'." });
                }

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

            if (!Enum.TryParse<OrderSource>(dto.Source, ignoreCase: true, out var parsedSource))
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = $"Invalid order source: {dto.Source}" });
            }

            if (!Enum.TryParse<ShippingRate>(dto.ShippingRate, ignoreCase: true, out var parsedRate))
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = $"Invalid shipping rate: {dto.ShippingRate}" });
            }

            order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = currentUser.UserId,
                Source = parsedSource,
                Status = OrderStatus.Pending,
                TotalAmount = total,
                ShippingRate = parsedRate,
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
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Create shipment record outside transaction (external service call)
        await fulfillmentService.CreateShipmentForOrderAsync(order);

        return CreatedAtAction(
            nameof(GetOrder),
            new { id = order.Id },
            new { orderId = order.Id, totalAmount = order.TotalAmount }
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
            .Include(o => o.Invoice)
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
            .Include(o => o.Invoice)
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
                LabelUrl = shipment.LabelUrl,
                CourierName =
                    shipment.Courier?.User != null
                        ? $"{shipment.Courier.User.FirstName} {shipment.Courier.User.LastName}".Trim()
                        : null,
                CourierPhone = shipment.Courier?.User?.Phone,
                History = shipment
                    .StatusHistory.OrderByDescending(h => h.ChangedAt)
                    .Select(h => new ShipmentStatusHistoryDto
                    {
                        Id = h.Id,
                        ShipmentId = h.ShipmentId,
                        Status = h.Status.ToString(),
                        Note = h.Note,
                        Location = h.Location,
                        CreatedAt = h.ChangedAt,
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
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == currentUser.UserId);

        if (order == null)
            return NotFound();

        if (!new[] { OrderStatus.Pending, OrderStatus.PaymentConfirmed }.Contains(order.Status))
            return BadRequest(new { message = "Order cannot be cancelled at this stage." });

        order.Status = OrderStatus.Cancelled;
        order.CancellationReason = dto.Reason;
        order.UpdatedAt = DateTime.UtcNow;

        // Restore stock for all items in the cancelled order
        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var products = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        foreach (var item in order.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product != null)
            {
                product.Stock += item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync();
        return Ok(new { message = "Order cancelled." });
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
                    .ThenInclude(p => p.Merchant)
            .Include(o => o.Customer)
            .Include(o => o.Shipment)
            .Include(o => o.Invoice)
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

    // ─── MERCHANT ──────────────────────────────────────────────

    /// <summary>GET /api/orders/merchant/incoming — Incoming orders for the merchant</summary>
    [HttpGet("merchant/incoming")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMerchantIncoming(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchantId = currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        var query = db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Customer)
            .Include(o => o.Shipment)
            .Include(o => o.Invoice)
            .Where(o => o.Items.Any(i => i.MerchantId == merchantId.Value))
            .AsQueryable();

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

    /// <summary>PATCH /api/orders/{id}/pack — Merchant: order packed (transition to LabelGenerated)</summary>
    [HttpPatch("{id:guid}/pack")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> PackOrder(Guid id)
    {
        var userId = currentUser.UserId;

        var merchant = await db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
        if (merchant == null)
            return Forbid();

        var order = await db
            .Orders.Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Customer)
            .Include(o => o.Shipment)
            .FirstOrDefaultAsync(o => o.Id == id && o.Items.Any(i => i.MerchantId == merchant.Id));

        if (order == null)
            return NotFound(new { message = "Order not found or access denied." });

        if (order.Status != OrderStatus.PaymentConfirmed && order.Status != OrderStatus.Pending)
            return BadRequest(
                new { message = $"This order cannot be packed. Current status: {order.Status}" }
            );

        order.Status = OrderStatus.LabelGenerated;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(
            new
            {
                message = "Order packed. Shipping label can now be generated.",
                status = order.Status.ToString(),
                orderId = order.Id,
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
            return BadRequest(new { message = "Invalid order status." });

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Order status updated.", status = newStatus.ToString() });
    }

    // ─── HELPER ────────────────────────────────────────────────

    private static OrderDto MapOrderToDto(Order order) =>
        new()
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer != null
                ? $"{order.Customer.FirstName} {order.Customer.LastName}".Trim()
                : order.RecipientName,
            MerchantId = order.Items.FirstOrDefault()?.MerchantId,
            MerchantStoreName = order.Items.FirstOrDefault()?.Product?.Merchant?.StoreName ?? string.Empty,
            Source = order.Source.ToString(),
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ShippingCost = order.ShippingAmount,
            VatAmount = order.Invoice?.VatAmount ?? 0,
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
                    MerchantStoreName = i.Product?.Merchant?.StoreName ?? string.Empty,
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
            // Milestone 3: Auto QuestPDF invoice — generated when payment is confirmed
            InvoiceId = order.Invoice?.Id,
            InvoiceNumber = order.Invoice?.InvoiceNumber,
            InvoicePdfUrl = order.Invoice?.PdfUrl,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
        };
}
