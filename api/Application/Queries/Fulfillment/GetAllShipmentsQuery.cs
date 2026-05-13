using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Fulfillment;

public record GetAllShipmentsQuery(
    string? Status,
    Guid? CourierId,
    int Page = 1,
    int Limit = 20
) : IRequest<PagedResult<ShipmentDto>>;

public class PagedResult<T>
{
    public IEnumerable<T> Data { get; set; } = [];
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int Pages { get; set; }
}

public class GetAllShipmentsQueryHandler
    : IRequestHandler<GetAllShipmentsQuery, PagedResult<ShipmentDto>>
{
    private readonly AppDbContext _context;

    public GetAllShipmentsQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ShipmentDto>> Handle(
        GetAllShipmentsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context
            .Shipments.Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .Include(s => s.StatusHistory)
            .Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .Include(s => s.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Merchant)
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(request.Status)
            && Enum.TryParse<ShipmentStatus>(request.Status, true, out var parsedStatus)
        )
            query = query.Where(s => s.Status == parsedStatus);

        if (request.CourierId.HasValue)
            query = query.Where(s => s.CourierId == request.CourierId.Value);

        var total = await query.CountAsync(cancellationToken);
        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        return new PagedResult<ShipmentDto>
        {
            Data = shipments.Select(s => new ShipmentDto
            {
                Id = s.Id,
                OrderId = s.OrderId,
                OrderNumber = s.Order?.Id.ToString("N")[..8].ToUpper() ?? string.Empty,
                CustomerName = s.Order?.Customer != null
                    ? $"{s.Order.Customer.FirstName} {s.Order.Customer.LastName}".Trim()
                    : s.Order?.RecipientName ?? string.Empty,
                CustomerAddress = s.Order != null
                    ? $"{s.Order.AddressLine}, {s.Order.City}".Trim(',', ' ')
                    : string.Empty,
                MerchantName = s.Order?.Items.FirstOrDefault()?.Product?.Merchant?.StoreName ?? string.Empty,
                CourierId = s.CourierId,
                CourierName =
                    s.Courier != null
                        ? $"{s.Courier.User?.FirstName} {s.Courier.User?.LastName}".Trim()
                        : null,
                Status = s.Status.ToString(),
                TrackingNumber = s.TrackingNumber,
                EstimatedDelivery = s.EstimatedDelivery,
                LabelUrl = s.LabelUrl,
                Events = s
                    .StatusHistory.OrderByDescending(h => h.ChangedAt)
                    .Select(h => new ShipmentStatusHistoryDto
                    {
                        Status = h.Status.ToString(),
                        Note = h.Note,
                        ChangedAt = h.ChangedAt,
                    })
                    .ToList(),
                CreatedAt = s.CreatedAt,
            }),
            Page = request.Page,
            Limit = request.Limit,
            Total = total,
            Pages = (int)Math.Ceiling((double)total / request.Limit),
        };
    }
}
