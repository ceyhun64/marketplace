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
[Route("api/fulfillment")]
[Authorize]
public class FulfillmentController(
    AppDbContext db,
    ICurrentUserService currentUser,
    IFulfillmentService fulfillmentService,
    ILabelGeneratorService labelGenerator,
    IShippingCalculatorService shippingCalculator
) : ControllerBase
{
    // ─── ADMIN ─────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] Guid? courierId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20
    )
    {
        var query = db
            .Shipments.Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .Include(s => s.StatusHistory)
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<ShipmentStatus>(status, out var parsedStatus)
        )
            query = query.Where(s => s.Status == parsedStatus);

        if (courierId.HasValue)
            query = query.Where(s => s.CourierId == courierId.Value);

        var total = await query.CountAsync();
        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(
            new
            {
                data = shipments.Select(MapToDto),
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
    [Authorize(Policy = "AdminOrCourier")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var shipment = await db
            .Shipments.Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null)
            return NotFound();

        if (currentUser.Role == "Courier")
        {
            var courier = await db.Couriers.FirstOrDefaultAsync(c =>
                c.UserId == currentUser.UserId
            );
            if (courier == null || shipment.CourierId != courier.Id)
                return Forbid();
        }

        return Ok(MapToDto(shipment));
    }

    [HttpPost("assign")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AssignCourier([FromBody] AssignCourierDto dto)
    {
        var shipment = await db.Shipments.FindAsync(dto.ShipmentId);
        if (shipment == null)
            return NotFound(new { message = "Shipment bulunamadı." });

        var courier = await db
            .Couriers.Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == dto.CourierId);
        if (courier == null)
            return NotFound(new { message = "Kurye bulunamadı." });

        if (!courier.IsActive)
            return BadRequest(new { message = "Kurye aktif değil." });

        shipment.CourierId = courier.Id;
        shipment.Status = ShipmentStatus.CourierAssigned;
        // UpdatedAt kaldırıldı — Shipment entity'sinde bu alan yok

        db.ShipmentStatusHistories.Add(
            new ShipmentStatusHistory
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                Status = ShipmentStatus.CourierAssigned,
                Note = $"Kurye atandı: {courier.User.FirstName} {courier.User.LastName}",
                ChangedAt = DateTime.UtcNow,
            }
        );

        await db.SaveChangesAsync();
        return Ok(new { message = "Kurye başarıyla atandı." });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "AdminOrCourier")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateShipmentStatusDto dto)
    {
        var shipment = await db
            .Shipments.Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (shipment == null)
            return NotFound();

        if (!Enum.TryParse<ShipmentStatus>(dto.Status, out var newStatus))
            return BadRequest(new { message = "Geçersiz shipment durumu." });

        await fulfillmentService.TransitionStatusAsync(shipment, newStatus, dto.Note);
        return Ok(new { message = "Durum güncellendi.", status = newStatus.ToString() });
    }

    [HttpGet("{id:guid}/label")]
    [Authorize(Policy = "AdminOrCourier")]
    public async Task<IActionResult> GetLabel(Guid id)
    {
        var shipment = await db
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Offer)
                        .ThenInclude(o => o.Merchant)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null)
            return NotFound();

        if (string.IsNullOrEmpty(shipment.LabelUrl))
        {
            var pdfBytes = await labelGenerator.GenerateLabelAsync(shipment.Id);
            return File(pdfBytes, "application/pdf", $"label-{shipment.TrackingNumber}.pdf");
        }

        return Redirect(shipment.LabelUrl);
    }

    [HttpPost("{id:guid}/generate-label")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GenerateLabel(Guid id)
    {
        var shipment = await db
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Offer)
                        .ThenInclude(o => o.Merchant)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null)
            return NotFound();

        var pdfBytes = await labelGenerator.GenerateLabelAsync(shipment.Id);
        shipment.LabelUrl = $"/api/fulfillment/{id}/label";
        await db.SaveChangesAsync();

        return File(pdfBytes, "application/pdf", $"label-{shipment.TrackingNumber}.pdf");
    }

    // ─── COURIER ───────────────────────────────────────────────

    [HttpGet("courier/my-shipments")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> GetMyShipments([FromQuery] string? status)
    {
        var courier = await db.Couriers.FirstOrDefaultAsync(c => c.UserId == currentUser.UserId);
        if (courier == null)
            return NotFound(new { message = "Kurye profili bulunamadı." });

        var query = db
            .Shipments.Include(s => s.StatusHistory)
            .Include(s => s.Order)
            .Where(s => s.CourierId == courier.Id);

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<ShipmentStatus>(status, out var parsedStatus)
        )
            query = query.Where(s => s.Status == parsedStatus);

        var shipments = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return Ok(shipments.Select(MapToDto));
    }

    [HttpPost("{id:guid}/pickup-confirm")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> PickupConfirm(Guid id, [FromBody] PickupConfirmDto dto)
    {
        var courier = await db.Couriers.FirstOrDefaultAsync(c => c.UserId == currentUser.UserId);
        if (courier == null)
            return Forbid();

        var shipment = await db
            .Shipments.Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == id && s.CourierId == courier.Id);
        if (shipment == null)
            return NotFound();

        await fulfillmentService.TransitionStatusAsync(
            shipment,
            ShipmentStatus.PickedUp,
            dto.Signature != null ? $"İmza alındı: {dto.Signature}" : "Teslim alındı"
        );

        return Ok(new { message = "Teslim alındı olarak işaretlendi." });
    }

    [HttpPost("{id:guid}/delivered")]
    [Authorize(Policy = "CourierOnly")]
    public async Task<IActionResult> MarkDelivered(Guid id, [FromBody] DeliveredConfirmDto dto)
    {
        var courier = await db.Couriers.FirstOrDefaultAsync(c => c.UserId == currentUser.UserId);
        if (courier == null)
            return Forbid();

        var shipment = await db
            .Shipments.Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == id && s.CourierId == courier.Id);
        if (shipment == null)
            return NotFound();

        var note =
            dto.RecipientName != null ? $"Teslim alan: {dto.RecipientName}" : "Teslim edildi";
        await fulfillmentService.TransitionStatusAsync(shipment, ShipmentStatus.Delivered, note);

        return Ok(new { message = "Teslim edildi olarak işaretlendi." });
    }

    // ─── PUBLIC ────────────────────────────────────────────────

    [HttpGet("calculate-eta")]
    [AllowAnonymous]
    public async Task<IActionResult> CalculateEta(
        [FromQuery] Guid merchantId,
        [FromQuery] double destLat,
        [FromQuery] double destLng,
        [FromQuery] string shippingRate = "Regular"
    )
    {
        var merchant = await db.MerchantProfiles.FindAsync(merchantId);
        if (merchant == null)
            return NotFound(new { message = "Merchant bulunamadı." });

        var rate = Enum.TryParse<ShippingRate>(shippingRate, out var parsedRate)
            ? parsedRate
            : ShippingRate.Regular;

        // ✅ Düzeltildi: CalculateDistance → CalculateDistanceKm, doğru imza
        var distanceKm = shippingCalculator.CalculateDistanceKm(
            merchant.Latitude,
            merchant.Longitude,
            destLat,
            destLng
        );

        // ✅ Düzeltildi: merchant lat/lng artık geçiliyor
        var estimatedHours = shippingCalculator.CalculateEtaHours(
            merchant.Latitude,
            merchant.Longitude,
            destLat,
            destLng,
            merchant.HandlingHours,
            rate
        );

        var estimatedDate = DateTime.UtcNow.AddHours(estimatedHours);

        return Ok(
            new EtaResponseDto
            {
                EstimatedHours = estimatedHours,
                EstimatedDeliveryDate = estimatedDate,
                DistanceKm = Math.Round(distanceKm, 2),
                ShippingRate = shippingRate,
            }
        );
    }

    // ─── HELPERS ───────────────────────────────────────────────

    private static ShipmentDto MapToDto(Shipment s) =>
        new()
        {
            Id = s.Id,
            OrderId = s.OrderId,
            CourierId = s.CourierId,
            CourierName =
                s.Courier != null
                    ? $"{s.Courier.User?.FirstName} {s.Courier.User?.LastName}".Trim()
                    : null,
            Status = s.Status.ToString(),
            TrackingNumber = s.TrackingNumber,
            EstimatedDelivery = s.EstimatedDelivery,
            LabelUrl = s.LabelUrl,
            History = s
                .StatusHistory.OrderByDescending(h => h.ChangedAt)
                .Select(h => new ShipmentStatusHistoryDto
                {
                    Status = h.Status.ToString(),
                    Note = h.Note,
                    ChangedAt = h.ChangedAt,
                })
                .ToList(),
            CreatedAt = s.CreatedAt,
        };
}
