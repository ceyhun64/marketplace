using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Fulfillment;

public record GetTrackingEventsQuery(string TrackingNumber)
    : IRequest<TrackingEventsResult?>;

public class TrackingEventsResult
{
    public string TrackingNo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime EstimatedDelivery { get; set; }
    public string? CourierName { get; set; }
    public string? CourierVehicle { get; set; }
    public IEnumerable<TrackingEventDto> Events { get; set; } = [];
}

public class TrackingEventDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? Location { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class GetTrackingEventsQueryHandler
    : IRequestHandler<GetTrackingEventsQuery, TrackingEventsResult?>
{
    private readonly AppDbContext _context;

    public GetTrackingEventsQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TrackingEventsResult?> Handle(
        GetTrackingEventsQuery request,
        CancellationToken cancellationToken
    )
    {
        var shipment = await _context
            .Shipments.Include(s => s.StatusHistory)
            .Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(s => s.TrackingNumber == request.TrackingNumber, cancellationToken);

        if (shipment == null)
            return null;

        return new TrackingEventsResult
        {
            TrackingNo = shipment.TrackingNumber,
            Status = shipment.Status.ToString(),
            EstimatedDelivery = shipment.EstimatedDelivery,
            CourierName = shipment.Courier != null
                ? $"{shipment.Courier.User?.FirstName} {shipment.Courier.User?.LastName}".Trim()
                : null,
            CourierVehicle = shipment.Courier?.VehicleType,
            Events = shipment
                .StatusHistory.OrderByDescending(h => h.ChangedAt)
                .Select(h => new TrackingEventDto
                {
                    Status = h.Status.ToString(),
                    Note = h.Note,
                    Location = h.Location,
                    ChangedAt = h.ChangedAt,
                }),
        };
    }
}
