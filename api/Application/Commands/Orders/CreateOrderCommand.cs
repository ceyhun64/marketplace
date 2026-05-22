using System.Data;
using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Orders;

public record CreateOrderCommand(CreateOrderDto Request) : IRequest<ServiceResult<OrderDto>>;

/// <summary>
/// MediatR path for order creation — kept in sync with OrdersController.CreateOrder.
/// Includes VendorOrder splitting, variant-aware stock decrement, escrow hold, and
/// dynamic commission resolution via ICommissionService.
/// </summary>
public class CreateOrderCommandHandler
    : IRequestHandler<CreateOrderCommand, ServiceResult<OrderDto>>
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFulfillmentService _fulfillmentService;
    private readonly IWalletService _walletService;
    private readonly ICommissionService _commissionService;

    public CreateOrderCommandHandler(
        AppDbContext context,
        ICurrentUserService currentUser,
        IFulfillmentService fulfillmentService,
        IWalletService walletService,
        ICommissionService commissionService
    )
    {
        _context = context;
        _currentUser = currentUser;
        _fulfillmentService = fulfillmentService;
        _walletService = walletService;
        _commissionService = commissionService;
    }

    public async Task<ServiceResult<OrderDto>> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken
    )
    {
        var dto = request.Request;
        var productIds = dto.Items.Select(i => i.ProductId).ToList();

        Order order = null!;
        List<OrderItem> orderItems = new();

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken
        );
        try
        {
            var products = await _context
                .Products.Include(p => p.Merchant)
                    .ThenInclude(m => m.Subscription)
                .Where(p => productIds.Contains(p.Id) && !p.IsDeleted)
                .ToListAsync(cancellationToken);

            // ── Variant resolution ────────────────────────────────────────────
            var variantIds = dto
                .Items.Where(i => i.VariantId.HasValue)
                .Select(i => i.VariantId!.Value)
                .ToList();

            var variants = variantIds.Any()
                ? await _context
                    .ProductVariants.Where(v => variantIds.Contains(v.Id) && v.IsActive)
                    .ToListAsync(cancellationToken)
                : new List<ProductVariant>();

            // ── Stock validation ──────────────────────────────────────────────
            foreach (var item in dto.Items)
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (product == null)
                    return ServiceResult<OrderDto>.Fail($"Product not found: {item.ProductId}");

                if (item.VariantId.HasValue)
                {
                    var variant = variants.FirstOrDefault(v =>
                        v.Id == item.VariantId.Value && v.ProductId == product.Id
                    );
                    if (variant == null)
                        return ServiceResult<OrderDto>.Fail(
                            $"Variant not found: {item.VariantId}"
                        );
                    if (variant.Stock < item.Quantity)
                        return ServiceResult<OrderDto>.Fail(
                            $"Insufficient variant stock for '{product.Name}'."
                        );
                }
                else
                {
                    if (product.Stock < item.Quantity)
                        return ServiceResult<OrderDto>.Fail($"Insufficient stock for '{product.Name}'.");
                }
            }

            if (
                !Enum.TryParse<ShippingRate>(
                    dto.ShippingRate,
                    ignoreCase: true,
                    out var shippingRate
                )
            )
                return ServiceResult<OrderDto>.Fail($"Invalid shipping rate: {dto.ShippingRate}");

            if (!Enum.TryParse<OrderSource>(dto.Source, ignoreCase: true, out var source))
                return ServiceResult<OrderDto>.Fail($"Invalid order source: {dto.Source}");

            // ── Build OrderItems + decrement stock ────────────────────────────
            decimal total = 0;
            foreach (var item in dto.Items)
            {
                var product = products.First(p => p.Id == item.ProductId);
                ProductVariant? variant = null;

                if (item.VariantId.HasValue)
                {
                    variant = variants.First(v => v.Id == item.VariantId.Value);
                    variant.Stock -= item.Quantity;
                    variant.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    product.Stock -= item.Quantity;
                }

                var effectivePrice = variant?.PriceOverride ?? product.Price;

                // ── Price sanity guard ────────────────────────────────────────
                // Prevents orders on products priced suspiciously low:
                //   • A merchant typo (e.g. $0.01 instead of $100)
                //   • A race-condition exploit: add-to-cart at $100, price
                //     slashed to $0.01 by merchant, checkout at $0.01
                //
                // A price is suspicious when:
                //   (a) Below the absolute floor ($0.50 — covers Stripe minimum)
                //   (b) More than 95 % below its category average (future enhancement)
                //
                // This guard reads the live DB price (already inside the
                // Serializable transaction) so it reflects the latest value.
                const decimal MinimumUnitPrice = 0.50m;
                if (effectivePrice < MinimumUnitPrice)
                    return ServiceResult<OrderDto>.Fail(
                        $"Product '{product.Name}' has an invalid price (${effectivePrice:F2}). " +
                        "Minimum allowed unit price is $0.50. Please contact the seller.");

                total += effectivePrice * item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

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
            }

            order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = _currentUser.UserId,
                Source = source,
                Status = OrderStatus.Pending,
                ShippingRate = shippingRate,
                TotalAmount = total,
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

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(cancellationToken); // materialise order.Id

            // ── VendorOrder splitting (one per merchant) ──────────────────────
            var itemsByMerchant = orderItems.GroupBy(i => i.MerchantId);
            var vendorOrders    = new List<VendorOrder>();

            foreach (var group in itemsByMerchant)
            {
                var merchantId = group.Key;
                var merchant   = products.First(p => p.MerchantId == merchantId).Merchant;
                var categoryId = products.FirstOrDefault(p => p.MerchantId == merchantId)?.CategoryId;
                var plan       = merchant.Subscription?.Plan;

                var feePercent = await _commissionService.ResolveRateAsync(merchantId, categoryId, plan);

                var subTotal = group.Sum(i => i.UnitPrice * i.Quantity);
                var fee      = Math.Round(subTotal * feePercent / 100m, 2);

                var vendorOrder = new VendorOrder
                {
                    Id                = Guid.NewGuid(),
                    OrderId           = order.Id,
                    MerchantId        = merchantId,
                    Status            = OrderStatus.Pending,
                    SubTotal          = subTotal,
                    PlatformFee       = fee,
                    MerchantNetAmount = subTotal - fee,
                    CreatedAt         = DateTime.UtcNow,
                    UpdatedAt         = DateTime.UtcNow,
                };

                _context.VendorOrders.Add(vendorOrder);
                await _context.SaveChangesAsync(cancellationToken); // materialise vendorOrder.Id

                foreach (var item in group)
                    item.VendorOrderId = vendorOrder.Id;

                await _walletService.HoldEscrowAsync(vendorOrder);
                vendorOrders.Add(vendorOrder);
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        // ── Per-vendor independent shipments ──────────────────────────────────
        // Each VendorOrder receives its own Shipment so merchants can dispatch,
        // track, and deliver their items independently.
        var vendorOrdersForShipment = order.Items
            .GroupBy(i => i.VendorOrderId)
            .Where(g => g.Key.HasValue)
            .Select(g => g.Key!.Value)
            .Distinct()
            .ToList();

        if (vendorOrdersForShipment.Count > 0)
        {
            // Load the newly created VendorOrder entities
            var voEntities = await System.Linq.AsyncEnumerable.ToListAsync(
                _context.VendorOrders
                    .Where(vo => vendorOrdersForShipment.Contains(vo.Id))
                    .AsAsyncEnumerable());

            foreach (var vo in voEntities)
                await _fulfillmentService.CreateShipmentForVendorOrderAsync(vo, order);
        }
        else
        {
            // Fallback: single-merchant order or VendorOrderId not yet linked
            await _fulfillmentService.CreateShipmentForOrderAsync(order);
        }

        return ServiceResult<OrderDto>.Ok(
            new OrderDto
            {
                Id = order.Id,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                ShippingRate = order.ShippingRate.ToString(),
                CreatedAt = order.CreatedAt,
                Items = orderItems
                    .Select(i => new OrderItemDto
                    {
                        ProductId = i.ProductId,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                    })
                    .ToList(),
            }
        );
    }
}
