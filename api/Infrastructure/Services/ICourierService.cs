using api.Common.DTOs;

namespace api.Infrastructure.Services;

public interface ICourierService
{
    Task<IEnumerable<CourierDto>> GetAllAsync(bool? isActive);
    Task<CourierDto?> GetByIdAsync(Guid id);
    Task<ServiceResult<CourierDto>> CreateAsync(CreateCourierDto dto);
    Task<ServiceResult<CourierDto>> UpdateAsync(Guid id, UpdateCourierDto dto);
    Task<ServiceResult<bool>> ToggleActiveAsync(Guid id);
    Task<IEnumerable<ShipmentDto>> GetShipmentsAsync(Guid courierId, string? status);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}
