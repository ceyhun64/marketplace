using api.Common.DTOs;
using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api.Infrastructure.Services;

public class CourierService : ICourierService
{
    private readonly AppDbContext _db;

    public CourierService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<CourierDto>> GetAllAsync(bool? isActive)
    {
        var query = _db.Couriers.Include(c => c.User).AsQueryable();

        if (isActive.HasValue)
            query = query.Where(c => c.IsActive == isActive.Value);

        return await query
            .Select(c => new CourierDto
            {
                Id = c.Id,
                Email = c.User.Email,
                FullName = $"{c.User.FirstName} {c.User.LastName}".Trim(),
                PhoneNumber = c.User.Phone,
                IsActive = c.IsActive,
                CurrentLat = c.CurrentLatitude,
                CurrentLng = c.CurrentLongitude,
                ActiveShipmentCount = c.Shipments.Count(s =>
                    s.Status != ShipmentStatus.Delivered && s.Status != ShipmentStatus.Failed
                ),
            })
            .ToListAsync();
    }

    public async Task<CourierDto?> GetByIdAsync(Guid id)
    {
        var c = await _db
            .Couriers.Include(c => c.User)
            .Include(c => c.Shipments)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null)
            return null;

        return new CourierDto
        {
            Id = c.Id,
            Email = c.User.Email,
            FullName = $"{c.User.FirstName} {c.User.LastName}".Trim(),
            PhoneNumber = c.User.Phone,
            IsActive = c.IsActive,
            CurrentLat = c.CurrentLatitude,
            CurrentLng = c.CurrentLongitude,
            ActiveShipmentCount = c.Shipments.Count(s =>
                s.Status != ShipmentStatus.Delivered && s.Status != ShipmentStatus.Failed
            ),
        };
    }

    public async Task<ServiceResult<CourierDto>> CreateAsync(CreateCourierDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            return ServiceResult<CourierDto>.Fail("Bu e-posta zaten kayıtlı.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLower(),
            FirstName = dto.FullName.Split(' ').FirstOrDefault() ?? dto.FullName,
            LastName = dto.FullName.Contains(' ')
                ? string.Join(' ', dto.FullName.Split(' ').Skip(1))
                : "",
            Phone = dto.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Courier,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var courier = new Courier
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            IsActive = true,
        };

        _db.Users.Add(user);
        _db.Couriers.Add(courier);
        await _db.SaveChangesAsync();

        return ServiceResult<CourierDto>.Ok(
            new CourierDto
            {
                Id = courier.Id,
                Email = user.Email,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                PhoneNumber = user.Phone,
                IsActive = courier.IsActive,
            }
        );
    }

    public async Task<ServiceResult<CourierDto>> UpdateAsync(Guid id, UpdateCourierDto dto)
    {
        var courier = await _db.Couriers.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
        if (courier == null)
            return ServiceResult<CourierDto>.Fail("Kurye bulunamadı.");

        if (dto.FullName != null)
        {
            var parts = dto.FullName.Split(' ');
            courier.User.FirstName = parts[0];
            courier.User.LastName = parts.Length > 1 ? string.Join(' ', parts.Skip(1)) : "";
        }

        if (dto.PhoneNumber != null)
            courier.User.Phone = dto.PhoneNumber;

        if (dto.IsActive.HasValue)
            courier.IsActive = dto.IsActive.Value;

        courier.User.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ServiceResult<CourierDto>.Ok(
            new CourierDto
            {
                Id = courier.Id,
                Email = courier.User.Email,
                FullName = $"{courier.User.FirstName} {courier.User.LastName}".Trim(),
                PhoneNumber = courier.User.Phone,
                IsActive = courier.IsActive,
            }
        );
    }

    public async Task<ServiceResult<bool>> ToggleActiveAsync(Guid id)
    {
        var courier = await _db.Couriers.FindAsync(id);
        if (courier == null)
            return ServiceResult<bool>.Fail("Kurye bulunamadı.");

        courier.IsActive = !courier.IsActive;
        await _db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(courier.IsActive);
    }

    public async Task<IEnumerable<ShipmentDto>> GetShipmentsAsync(Guid courierId, string? status)
    {
        var query = _db
            .Shipments.Include(s => s.StatusHistory)
            .Where(s => s.CourierId == courierId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ShipmentStatus>(status, out var ps))
            query = query.Where(s => s.Status == ps);

        var shipments = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();

        return shipments.Select(s => new ShipmentDto
        {
            Id = s.Id,
            OrderId = s.OrderId,
            CourierId = s.CourierId,
            Status = s.Status.ToString(),
            TrackingNumber = s.TrackingNumber,
            EstimatedDelivery = s.EstimatedDelivery,
            LabelUrl = s.LabelUrl,
            CreatedAt = s.CreatedAt,
        });
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var courier = await _db.Couriers.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
        if (courier == null)
            return ServiceResult<bool>.Fail("Kurye bulunamadı.");

        courier.User.IsDeleted = true;
        courier.IsActive = false;
        courier.User.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
