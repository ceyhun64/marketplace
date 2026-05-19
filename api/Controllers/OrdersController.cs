using System.Data;
using api.Common.DTOs;
using api.Common.Extensions;
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

        Order order = null!;
        List<OrderItem> orderItems = new();

        // Serializable isolation prevents race conditions — same stock cannot be allocated
        // to two concurrent orders.
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable
        );
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

            // Resolve variants (optional per item)
            var variantIds = dto
                .Items.Where(i => i.VariantId.HasValue)
                .Select(i => i.VariantId!.Value)
                .ToList();
            var variants = variantIds.Any()
                ? await db
                    .ProductVariants.Where(v => variantIds.Contains(v.Id) && v.IsActive)
                    .ToListAsync()
                : new List<ProductVariant>();

            decimal total = 0;

            foreach (var item in dto.Items)
            {
                var product = products.First(p => p.Id == item.ProductId);

                // Determine effective price and stock source
                ProductVariant? variant = null;
                if (item.VariantId.HasValue)
                {
                    variant = variants.FirstOrDefault(v =>
                        v.Id == item.VariantId.Value && v.ProductId == product.Id
                    );
                    if (variant == null)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(
                            new { message = $"Variant not found for '{product.Name}'." }
                        );
                    }
                    if (variant.Stock < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(
                            new { message = $"Insufficient variant stock for '{product.Name}'." }
                        );
                    }
                    variant.Stock -= item.Quantity;
                    variant.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    if (product.Stock < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(
                            new { message = $"Insufficient stock for '{product.Name}'." }
                        );
                    }
                    product.Stock -= item.Quantity;
                }

                var effectivePrice = variant?.PriceOverride ?? product.Price;

                orderItems.Add(
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        MerchantId = product.MerchantId,
                        VariantId = variant?.Id,
                        VariantAttributes = variant?.Attributes,
                        ProductName = product.Name,
                        ProductImage = variant?.ImageUrl ?? product.Images.FirstOrDefault(),
                        UnitPrice = effectivePrice,
                        Quantity = item.Quantity,
                    }
                );

                total += effectivePrice * item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }

            if (!Enum.TryParse<OrderSource>(dto.Source, ignoreCase: true, out var parsedSource))
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = $"Invalid order source: {dto.Source}" });
            }

            if (
                !Enum.TryParse<ShippingRate>(dto.ShippingRate, ignoreCase: true, out var parsedRate)
            )
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
            await db.SaveChangesAsync(); // get order.Id before VendorOrders

            // ── Split into VendorOrders (one per merchant) ────────────────────
            var platformFeePercent = 8.0m; // TODO: read from IConfiguration
            var itemsByMerchant = orderItems.GroupBy(i => i.MerchantId);

            foreach (var group in itemsByMerchant)
            {
                var subTotal = group.Sum(i => i.UnitPrice * i.Quantity);
                var fee = Math.Round(subTotal * platformFeePercent / 100m, 2);
                var vendorOrder = new VendorOrder
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    MerchantId = group.Key,
                    Status = OrderStatus.Pending,
                    SubTotal = subTotal,
                    PlatformFee = fee,
                    MerchantNetAmount = subTotal - fee,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                db.VendorOrders.Add(vendorOrder);
                await db.SaveChangesAsync(); // get vendorOrder.Id

                // Link items
                foreach (var item in group)
                {
                    item.VendorOrderId = vendorOrder.Id;
                }
            }

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
                OrderStatus = order.Status.ToApiString(),
                TrackingNumber = shipment.TrackingNumber,
                ShipmentStatus = shipment.Status.ToApiString(),
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
                        Status = h.Status.ToApiString(),
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
        var order = await db
            .Orders.Include(o => o.Items)
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
        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

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

    // ── VENDOR ORDERS (tenant-isolated merchant view) ────────────────────────

    /// <summary>GET /api/orders/merchant/vendor-orders — Merchant's sub-orders (cross-tenant safe)</summary>
    [HttpGet("merchant/vendor-orders")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMerchantVendorOrders(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var merchantId = currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        var query = db
            .VendorOrders.Include(vo => vo.Order)
                .ThenInclude(o => o.Customer)
            .Include(vo => vo.Items)
                .ThenInclude(i => i.Product)
            .Include(vo => vo.Order)
                .ThenInclude(o => o.Shipment)
            .Where(vo => vo.MerchantId == merchantId.Value)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var ps))
            query = query.Where(vo => vo.Status == ps);

        var total = await query.CountAsync();
        var vendorOrders = await query
            .OrderByDescending(vo => vo.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = vendorOrders.Select(vo => new
                {
                    vo.Id,
                    vo.OrderId,
                    vo.Status,
                    vo.SubTotal,
                    vo.PlatformFee,
                    vo.MerchantNetAmount,
                    vo.SettledAt,
                    vo.CreatedAt,
                    vo.UpdatedAt,
                    Customer = vo.Order.Customer == null
                        ? null
                        : new
                        {
                            vo.Order.Customer.Id,
                            vo.Order.Customer.Email,
                            Name = $"{vo.Order.Customer.FirstName} {vo.Order.Customer.LastName}".Trim(),
                        },
                    ShippingAddress = new
                    {
                        vo.Order.RecipientName,
                        vo.Order.RecipientPhone,
                        vo.Order.AddressLine,
                        vo.Order.City,
                        vo.Order.PostalCode,
                    },
                    Shipment = vo.Order.Shipment == null
                        ? null
                        : new
                        {
                            vo.Order.Shipment.TrackingNumber,
                            Status = vo.Order.Shipment.Status.ToString(),
                        },
                    Items = vo.Items.Select(i => new
                    {
                        i.Id,
                        i.ProductId,
                        i.ProductName,
                        i.ProductImage,
                        i.UnitPrice,
                        i.Quantity,
                        i.LineTotal,
                        i.VariantAttributes,
                    }),
                }),
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

    /// <summary>PATCH /api/orders/merchant/vendor-orders/{id}/pack — Merchant packs their sub-order</summary>
    [HttpPatch("merchant/vendor-orders/{id:guid}/pack")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> PackVendorOrder(Guid id, [FromServices] IConfiguration config)
    {
        var merchantId = currentUser.MerchantId;
        if (merchantId == null)
            return Forbid();

        var vendorOrder = await db
            .VendorOrders.Include(vo => vo.Order)
            .FirstOrDefaultAsync(vo => vo.Id == id && vo.MerchantId == merchantId.Value);

        if (vendorOrder == null)
            return NotFound(new { message = "Vendor order not found or access denied." });

        if (
            vendorOrder.Status != OrderStatus.PaymentConfirmed
            && vendorOrder.Status != OrderStatus.Pending
        )
            return BadRequest(
                new { message = $"Cannot pack. Current status: {vendorOrder.Status}" }
            );

        vendorOrder.Status = OrderStatus.LabelGenerated;
        vendorOrder.UpdatedAt = DateTime.UtcNow;

        // Mirror on parent order if all vendor orders for this parent are now LabelGenerated
        var siblingStatuses = await db
            .VendorOrders.Where(vo => vo.OrderId == vendorOrder.OrderId && vo.Id != vendorOrder.Id)
            .Select(vo => vo.Status)
            .ToListAsync();

        if (siblingStatuses.All(s => s == OrderStatus.LabelGenerated))
        {
            vendorOrder.Order.Status = OrderStatus.LabelGenerated;
            vendorOrder.Order.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        return Ok(
            new
            {
                message = "Vendor order packed. Courier dispatch will be triggered automatically.",
                vendorOrderId = vendorOrder.Id,
                status = vendorOrder.Status.ToApiString(),
            }
        );
    }

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
                status = order.Status.ToApiString(),
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

        return Ok(new { message = "Order status updated.", status = newStatus.ToApiString() });
    }

    // ─── HELPER ────────────────────────────────────────────────

    private static OrderDto MapOrderToDto(Order order) =>
        new()
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            CustomerName =
                order.Customer != null
                    ? $"{order.Customer.FirstName} {order.Customer.LastName}".Trim()
                    : order.RecipientName,
            MerchantId = order.Items.FirstOrDefault()?.MerchantId,
            MerchantStoreName =
                order.Items.FirstOrDefault()?.Product?.Merchant?.StoreName ?? string.Empty,
            Source = order.Source.ToApiString(),
            Status = order.Status.ToApiString(),
            TotalAmount = order.TotalAmount,
            ShippingCost = order.ShippingAmount,
            VatAmount = order.Invoice?.VatAmount ?? 0,
            ShippingRate = order.ShippingRate.ToApiString(),
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
                        Status = order.Shipment.Status.ToApiString(),
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
