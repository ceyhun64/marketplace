using api.Common.DTOs;
using api.Infrastructure.Hubs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/couriers")]
[Authorize(Policy = "AdminOnly")]
public class CouriersController : ControllerBase
{
    private readonly ICourierService _courierService;
    private readonly AppDbContext _db;
    private readonly IHubContext<TrackingHub> _hub;
    private readonly ICurrentUserService _currentUser;

    public CouriersController(
        ICourierService courierService,
        AppDbContext db,
        IHubContext<TrackingHub> hub,
        ICurrentUserService currentUser
    )
    {
        _courierService = courierService;
        _db = db;
        _hub = hub;
        _currentUser = currentUser;
    }

    // GET /api/couriers — Admin
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive)
    {
        var couriers = await _courierService.GetAllAsync(isActive);
        return Ok(new ApiResponse<IEnumerable<CourierDto>>(couriers));
    }

    // GET /api/couriers/{id} — Admin
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var courier = await _courierService.GetByIdAsync(id);
        if (courier == null)
            return NotFound(new ApiResponse<string>("Kurye bulunamadı."));
        return Ok(new ApiResponse<CourierDto>(courier));
    }

    // POST /api/couriers — Admin
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCourierDto request)
    {
        var result = await _courierService.CreateAsync(request);
        if (!result.Success || result.Data is null)
            return BadRequest(new ApiResponse<string>(result.Message));
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data.Id },
            new ApiResponse<CourierDto>(result.Data!)
        );
    }

    // PUT /api/couriers/{id} — Admin
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourierDto request)
    {
        var result = await _courierService.UpdateAsync(id, request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<CourierDto>(result.Data!));
    }

    // PATCH /api/couriers/{id}/toggle-active — Admin
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var result = await _courierService.ToggleActiveAsync(id);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(
            new ApiResponse<string>(
                $"Kurye durumu güncellendi: {(result.Data ? "aktif" : "pasif")}"
            )
        );
    }

    // GET /api/couriers/{id}/shipments — Admin
    [HttpGet("{id}/shipments")]
    public async Task<IActionResult> GetCourierShipments(Guid id, [FromQuery] string? status)
    {
        var shipments = await _courierService.GetShipmentsAsync(id, status);
        return Ok(new ApiResponse<IEnumerable<ShipmentDto>>(shipments));
    }

    // DELETE /api/couriers/{id} — Admin
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _courierService.DeleteAsync(id);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<string>("Kurye silindi."));
    }

    // GET /api/couriers/me — Courier (kendi profili)
    [HttpGet("me")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> GetMyProfile()
    {
        var courier = await _db.Couriers
            .Include(c => c.User)
            .Include(c => c.Shipments)
            .FirstOrDefaultAsync(c => c.UserId == _currentUser.UserId);

        if (courier == null)
            return NotFound(new { message = "Kurye profili bulunamadı." });

        var totalDelivered = courier.Shipments.Count(s => s.Status == Domain.Enums.ShipmentStatus.Delivered);
        var totalActive = courier.Shipments.Count(s =>
            s.Status != Domain.Enums.ShipmentStatus.Delivered &&
            s.Status != Domain.Enums.ShipmentStatus.Failed);
        var todayDelivered = courier.Shipments.Count(s =>
            s.Status == Domain.Enums.ShipmentStatus.Delivered &&
            s.UpdatedAt.Date == DateTime.UtcNow.Date);

        return Ok(new
        {
            courier.Id,
            courier.UserId,
            FullName = courier.User.FirstName + " " + courier.User.LastName,
            Email = courier.User.Email,
            Phone = courier.User.Phone,
            courier.VehicleType,
            courier.PlateNumber,
            courier.IsActive,
            courier.IsAvailable,
            courier.CurrentLatitude,
            courier.CurrentLongitude,
            courier.LastLocationUpdate,
            courier.CreatedAt,
            Stats = new
            {
                TotalDelivered = totalDelivered,
                TotalActive = totalActive,
                TodayDelivered = todayDelivered,
            }
        });
    }

    // PATCH /api/couriers/me/availability — Courier (müsaitlik toggle)
    [HttpPatch("me/availability")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> ToggleMyAvailability()
    {
        var courier = await _db.Couriers.FirstOrDefaultAsync(c => c.UserId == _currentUser.UserId);
        if (courier == null)
            return NotFound(new { message = "Kurye profili bulunamadı." });

        courier.IsAvailable = !courier.IsAvailable;
        await _db.SaveChangesAsync();

        return Ok(new { isAvailable = courier.IsAvailable, message = courier.IsAvailable ? "Çevrimiçi" : "Çevrimdışı" });
    }

    // PUT /api/couriers/me/location — Courier
    // Kurye kendi anlık konumunu günceller; SignalR ile admin + müşterilere yayınlanır.
    [HttpPut("me/location")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> UpdateMyLocation([FromBody] CourierLocationDto dto)
    {
        var courier = await _db.Couriers.FirstOrDefaultAsync(c => c.UserId == _currentUser.UserId);

        if (courier == null)
            return NotFound(new ApiResponse<string>("Kurye profili bulunamadı."));

        courier.CurrentLatitude = dto.Latitude;
        courier.CurrentLongitude = dto.Longitude;
        courier.LastLocationUpdate = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Aktif shipment'ları bul ve ilgili gruplara konum yay
        var activeShipmentIds = await _db
            .Shipments.Where(s =>
                s.CourierId == courier.Id
                && s.Status != Domain.Enums.ShipmentStatus.Delivered
                && s.Status != Domain.Enums.ShipmentStatus.Failed
            )
            .Select(s => s.Id.ToString())
            .ToListAsync();

        var payload = new
        {
            courierId = courier.Id,
            latitude = dto.Latitude,
            longitude = dto.Longitude,
            timestamp = DateTime.UtcNow,
        };

        foreach (var shipmentId in activeShipmentIds)
        {
            await _hub
                .Clients.Group($"shipment-{shipmentId}")
                .SendAsync("LocationUpdated", payload);
        }

        await _hub.Clients.Group("admin-tracking").SendAsync("CourierLocationUpdated", payload);

        return Ok(new ApiResponse<string>("Konum güncellendi."));
    }

    // GET /api/couriers/me/earnings — Courier (kazanç özeti)
    [HttpGet("me/earnings")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> GetMyEarnings()
    {
        var courier = await _db.Couriers
            .FirstOrDefaultAsync(c => c.UserId == _currentUser.UserId);
        if (courier == null)
            return NotFound(new { message = "Kurye profili bulunamadı." });

        var delivered = await _db.Shipments
            .Include(s => s.Order)
            .Where(s => s.CourierId == courier.Id &&
                        s.Status == Domain.Enums.ShipmentStatus.Delivered)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var weekStart = now.AddDays(-7);

        var totalEarnings = delivered.Sum(s => s.Order.ShippingAmount);
        var thisMonthEarnings = delivered
            .Where(s => s.UpdatedAt >= monthStart)
            .Sum(s => s.Order.ShippingAmount);
        var thisWeekDeliveries = delivered.Count(s => s.UpdatedAt >= weekStart);

        return Ok(new
        {
            totalEarnings,
            pendingPayout = 0m,
            withdrawnTotal = 0m,
            totalDeliveries = delivered.Count,
            thisMonthEarnings,
            thisWeekDeliveries,
        });
    }

    // GET /api/couriers/me/deliveries — Courier (teslimat geçmişi)
    [HttpGet("me/deliveries")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> GetMyDeliveries([FromQuery] int limit = 50)
    {
        var courier = await _db.Couriers
            .FirstOrDefaultAsync(c => c.UserId == _currentUser.UserId);
        if (courier == null)
            return NotFound(new { message = "Kurye profili bulunamadı." });

        var deliveries = await _db.Shipments
            .Include(s => s.Order)
            .ThenInclude(o => o.Customer)
            .Where(s => s.CourierId == courier.Id &&
                        s.Status == Domain.Enums.ShipmentStatus.Delivered)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(limit)
            .Select(s => new
            {
                id = s.Id,
                trackingNumber = s.TrackingNumber,
                customerName = s.Order.Customer.FirstName + " " + s.Order.Customer.LastName,
                deliveredAt = s.UpdatedAt,
                deliveryFee = s.Order.ShippingAmount,
                tip = (decimal?)null,
                orderNumber = s.OrderId.ToString().Substring(0, 8).ToUpper(),
            })
            .ToListAsync();

        return Ok(deliveries);
    }
}
