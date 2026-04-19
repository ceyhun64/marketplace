using api.Common.DTOs;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/couriers")]
[Authorize(Policy = "AdminOnly")]
public class CouriersController : ControllerBase
{
    private readonly ICourierService _courierService;

    public CouriersController(ICourierService courierService)
    {
        _courierService = courierService;
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
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data.Id },
            new ApiResponse<CourierDto>(result.Data)
        );
    }

    // PUT /api/couriers/{id} — Admin
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourierDto request)
    {
        var result = await _courierService.UpdateAsync(id, request);
        if (!result.Success)
            return BadRequest(new ApiResponse<string>(result.Message));
        return Ok(new ApiResponse<CourierDto>(result.Data));
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
}
