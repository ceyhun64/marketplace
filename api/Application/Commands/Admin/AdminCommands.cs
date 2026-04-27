using api.Domain.Enums;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Admin;

// ── Approve Product ───────────────────────────────────────────────────────────

public record ApproveProductAdminCommand(Guid ProductId) : IRequest<ServiceResult<bool>>;

public class ApproveProductAdminCommandHandler
    : IRequestHandler<ApproveProductAdminCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;

    public ApproveProductAdminCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<bool>> Handle(
        ApproveProductAdminCommand request,
        CancellationToken cancellationToken
    )
    {
        var product = await _db.Products.FindAsync([request.ProductId], cancellationToken);
        if (product == null || product.IsDeleted)
            return ServiceResult<bool>.Fail("Ürün bulunamadı.");

        product.IsApproved = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }
}

// ── Toggle Merchant Suspend ───────────────────────────────────────────────────

public record ToggleMerchantSuspendCommand(Guid MerchantId)
    : IRequest<ServiceResult<MerchantSuspendResult>>;

public record MerchantSuspendResult(Guid Id, bool IsActive);

public class ToggleMerchantSuspendCommandHandler
    : IRequestHandler<ToggleMerchantSuspendCommand, ServiceResult<MerchantSuspendResult>>
{
    private readonly AppDbContext _db;

    public ToggleMerchantSuspendCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<MerchantSuspendResult>> Handle(
        ToggleMerchantSuspendCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _db.MerchantProfiles.FindAsync(
            [request.MerchantId],
            cancellationToken
        );
        if (merchant == null)
            return ServiceResult<MerchantSuspendResult>.Fail("Merchant bulunamadı.");

        merchant.IsActive = !merchant.IsActive;
        merchant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ServiceResult<MerchantSuspendResult>.Ok(
            new MerchantSuspendResult(merchant.Id, merchant.IsActive)
        );
    }
}

// ── Update Order Status (Admin) ───────────────────────────────────────────────

public record UpdateOrderStatusAdminCommand(Guid OrderId, string Status)
    : IRequest<ServiceResult<bool>>;

public class UpdateOrderStatusAdminCommandHandler
    : IRequestHandler<UpdateOrderStatusAdminCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;

    public UpdateOrderStatusAdminCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<bool>> Handle(
        UpdateOrderStatusAdminCommand request,
        CancellationToken cancellationToken
    )
    {
        var order = await _db.Orders.FindAsync([request.OrderId], cancellationToken);
        if (order == null)
            return ServiceResult<bool>.Fail("Sipariş bulunamadı.");

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            return ServiceResult<bool>.Fail("Geçersiz sipariş durumu.");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }
}

// ── Create Merchant (Admin) ───────────────────────────────────────────────────

public record CreateMerchantAdminCommand(
    string Email,
    string Password,
    string StoreName,
    string Slug,
    double Latitude,
    double Longitude,
    int? HandlingHours
) : IRequest<ServiceResult<CreatedMerchantResult>>;

public record CreatedMerchantResult(Guid Id, string StoreName, string Slug);

public class CreateMerchantAdminCommandHandler
    : IRequestHandler<CreateMerchantAdminCommand, ServiceResult<CreatedMerchantResult>>
{
    private readonly AppDbContext _db;

    public CreateMerchantAdminCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<CreatedMerchantResult>> Handle(
        CreateMerchantAdminCommand request,
        CancellationToken cancellationToken
    )
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower(), cancellationToken))
            return ServiceResult<CreatedMerchantResult>.Fail("Bu e-posta zaten kayıtlı.");

        if (await _db.MerchantProfiles.AnyAsync(m => m.Slug == request.Slug, cancellationToken))
            return ServiceResult<CreatedMerchantResult>.Fail("Bu slug zaten kullanımda.");

        var user = new Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Merchant,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow,
        };

        var merchant = new Domain.Entities.MerchantProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StoreName = request.StoreName,
            Slug = request.Slug,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            HandlingHours = request.HandlingHours ?? 24,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        _db.MerchantProfiles.Add(merchant);
        await _db.SaveChangesAsync(cancellationToken);

        return ServiceResult<CreatedMerchantResult>.Ok(
            new CreatedMerchantResult(merchant.Id, merchant.StoreName, merchant.Slug)
        );
    }
}

// ── Update Merchant (Admin) ───────────────────────────────────────────────────

public record UpdateMerchantAdminCommand(
    Guid MerchantId,
    string? StoreName,
    double? Latitude,
    double? Longitude,
    int? HandlingHours
) : IRequest<ServiceResult<bool>>;

public class UpdateMerchantAdminCommandHandler
    : IRequestHandler<UpdateMerchantAdminCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;

    public UpdateMerchantAdminCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<bool>> Handle(
        UpdateMerchantAdminCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _db.MerchantProfiles.FindAsync(
            [request.MerchantId],
            cancellationToken
        );
        if (merchant == null)
            return ServiceResult<bool>.Fail("Merchant bulunamadı.");

        merchant.StoreName = request.StoreName ?? merchant.StoreName;
        merchant.Latitude = request.Latitude ?? merchant.Latitude;
        merchant.Longitude = request.Longitude ?? merchant.Longitude;
        merchant.HandlingHours = request.HandlingHours ?? merchant.HandlingHours;
        merchant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }
}

// ── Setup Merchant Store (Admin) ──────────────────────────────────────────────

public record SetupMerchantStoreCommand(
    Guid MerchantId,
    string? StoreName,
    string? Slug,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    int? HandlingHours,
    double? Latitude,
    double? Longitude
) : IRequest<ServiceResult<bool>>;

public class SetupMerchantStoreCommandHandler
    : IRequestHandler<SetupMerchantStoreCommand, ServiceResult<bool>>
{
    private readonly AppDbContext _db;

    public SetupMerchantStoreCommandHandler(AppDbContext db) => _db = db;

    public async Task<ServiceResult<bool>> Handle(
        SetupMerchantStoreCommand request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _db.MerchantProfiles.FindAsync(
            [request.MerchantId],
            cancellationToken
        );
        if (merchant == null)
            return ServiceResult<bool>.Fail("Merchant bulunamadı.");

        if (request.StoreName is not null)
            merchant.StoreName = request.StoreName;
        if (request.Slug is not null)
            merchant.Slug = request.Slug;
        if (request.Description is not null)
            merchant.Description = request.Description;
        if (request.LogoUrl is not null)
            merchant.LogoUrl = request.LogoUrl;
        if (request.BannerUrl is not null)
            merchant.BannerUrl = request.BannerUrl;
        if (request.HandlingHours.HasValue)
            merchant.HandlingHours = request.HandlingHours.Value;
        if (request.Latitude.HasValue)
            merchant.Latitude = request.Latitude.Value;
        if (request.Longitude.HasValue)
            merchant.Longitude = request.Longitude.Value;
        merchant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }
}
