using api.Application.Commands.Orders;
using api.Common.DTOs;
using api.Common.Extensions;
using api.Domain.Entities; // Kendi proje yapınıza göre burayı düzenleyin (örn: api.Domain.Models veya api.Domain.Orders de olabilir)
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
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
    IMediator mediator
) : ControllerBase
{
    // ─── CUSTOMER ──────────────────────────────────────────────

    /// <summary>
    /// POST /api/orders
    ///
    /// Delegates entirely to <see cref="CreateOrderCommandHandler"/>, which owns:
    ///   • Serializable transaction + stock decrement (variant-aware)
    ///   • VendorOrder splitting with dynamic commission resolution
    ///   • Escrow hold via IWalletService
    ///   • Per-VendorOrder shipment creation via IFulfillmentService
    ///
    /// The controller is intentionally thin — all business logic lives in the handler.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        var result = await mediator.Send(new CreateOrderCommand(dto));

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return CreatedAtAction(nameof(GetOrder), new { id = result.Data!.Id }, result.Data);
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

        // ── Cancel associated VendorOrders (non-terminal only) ──────────────
        // This ensures per-merchant sub-orders reflect the cancellation so the
        // merchant dashboard is accurate and escrow is not settled for a cancelled order.
        var vendorOrders = await db.VendorOrders.Where(vo => vo.OrderId == id).ToListAsync();

        var terminalStatuses = new[] { OrderStatus.Delivered, OrderStatus.Cancelled };
        foreach (var vo in vendorOrders)
        {
            if (!terminalStatuses.Contains(vo.Status))
            {
                vo.Status = OrderStatus.Cancelled;
                vo.UpdatedAt = DateTime.UtcNow;
            }
        }

        // ── Variant-aware stock restoration ──────────────────────────────────
        // If an OrderItem was placed against a specific ProductVariant, the stock
        // must be returned to that variant's pool — not to the base product.Stock.
        // Failing to do this causes permanent variant-level stock drift.
        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var variantIds = order
            .Items.Where(i => i.VariantId.HasValue)
            .Select(i => i.VariantId!.Value)
            .Distinct()
            .ToList();

        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();
        var variants = variantIds.Any()
            ? await db.ProductVariants.Where(v => variantIds.Contains(v.Id)).ToListAsync()
            : new List<ProductVariant>();

        foreach (var item in order.Items)
        {
            if (item.VariantId.HasValue)
            {
                var variant = variants.FirstOrDefault(v => v.Id == item.VariantId.Value);
                if (variant != null)
                {
                    variant.Stock += item.Quantity;
                    variant.UpdatedAt = DateTime.UtcNow;
                }
            }
            else
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (product != null)
                {
                    product.Stock += item.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }
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
        var query = db.Orders.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var ps))
            query = query.Where(o => o.Status == ps);

        if (merchantId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.MerchantId == merchantId.Value));

        var total = await query.CountAsync();

        // Project to a DTO in SQL — no Include chain, no N+1 joins
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(o => new
            {
                o.Id,
                o.CustomerId,
                CustomerName = (o.Customer.FirstName + " " + o.Customer.LastName).Trim(),
                CustomerEmail = o.Customer.Email,
                o.Status,
                o.Source,
                o.TotalAmount,
                o.ShippingAmount,
                o.PaymentId,
                o.CreatedAt,
                o.UpdatedAt,
                o.RecipientName,
                o.RecipientPhone,
                o.AddressLine,
                o.City,
                o.District,
                o.PostalCode,
                o.CancellationReason,
                ItemCount = o.Items.Count,
                TrackingNumber = o.Shipment != null ? o.Shipment.TrackingNumber : null,
                ShipmentStatus = o.Shipment != null ? (ShipmentStatus?)o.Shipment.Status : null,
                InvoiceNumber = o.Invoice != null ? o.Invoice.InvoiceNumber : null,
                VatAmount = o.Invoice != null ? (decimal?)o.Invoice.VatAmount : null,
                FirstMerchantId = o.Items.Select(i => (Guid?)i.MerchantId).FirstOrDefault(),
                FirstMerchantStoreName = o.Items.Select(i => i.Product.Merchant.StoreName)
                    .FirstOrDefault()
                    ?? string.Empty,
                Items = o
                    .Items.Select(i => new
                    {
                        i.Id,
                        i.ProductId,
                        i.ProductName,
                        i.ProductImage,
                        i.MerchantId,
                        MerchantStoreName = i.Product.Merchant.StoreName,
                        i.Quantity,
                        i.UnitPrice,
                        i.VariantId,
                        i.VariantAttributes,
                    })
                    .ToList(),
            })
            .ToListAsync();

        return Ok(
            new
            {
                data = orders.Select(o => new OrderDto
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,
                    CustomerName = o.CustomerName,
                    MerchantId = o.FirstMerchantId,
                    MerchantStoreName = o.FirstMerchantStoreName,
                    Source = o.Source.ToApiString(),
                    Status = o.Status.ToApiString(),
                    TotalAmount = o.TotalAmount,
                    ShippingCost = o.ShippingAmount,
                    VatAmount = o.VatAmount ?? 0,
                    ShippingRate = string.Empty,
                    PaymentId = o.PaymentId,
                    ShippingAddress = new ShippingAddressDto
                    {
                        FullName = o.RecipientName,
                        Phone = o.RecipientPhone,
                        AddressLine = o.AddressLine,
                        City = o.City,
                        District = o.District,
                        PostalCode = o.PostalCode,
                    },
                    Items = o
                        .Items.Select(i => new OrderItemDto
                        {
                            Id = i.Id,
                            ProductId = i.ProductId,
                            ProductName = i.ProductName,
                            ProductImageUrl = i.ProductImage,
                            MerchantId = i.MerchantId,
                            MerchantStoreName = i.MerchantStoreName,
                            Quantity = i.Quantity,
                            UnitPrice = i.UnitPrice,
                            SubTotal = i.UnitPrice * i.Quantity,
                        })
                        .ToList(),
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
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
