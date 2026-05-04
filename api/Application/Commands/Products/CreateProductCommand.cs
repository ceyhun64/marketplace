using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Products;

public record CreateProductCommand(
    string Name,
    string Description,
    Guid CategoryId,
    decimal Price,
    int Stock,
    Guid? MerchantId = null,
    List<string>? Images = null,
    List<string>? Tags = null,
    string? ShortDescription = null,
    bool PublishToMarket = false,
    bool PublishToStore = true
) : IRequest<CreateProductResult>;

public record CreateProductResult(Guid Id, string Name, bool IsApproved);

public class CreateProductCommandHandler
    : IRequestHandler<CreateProductCommand, CreateProductResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateProductCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateProductResult> Handle(
        CreateProductCommand request,
        CancellationToken cancellationToken
    )
    {
        bool isAdmin = _currentUser.Role is nameof(UserRole.Admin);

        // MerchantId çözümleme: admin başka merchant adına ekleyebilir
        Guid merchantId;
        if (isAdmin && request.MerchantId.HasValue)
        {
            merchantId = request.MerchantId.Value;
        }
        else
        {
            var merchant = await _db.MerchantProfiles
                .FirstOrDefaultAsync(m => m.UserId == _currentUser.UserId, cancellationToken);
            if (merchant is null)
                throw new InvalidOperationException("Merchant profili bulunamadı.");
            merchantId = merchant.Id;
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            ShortDescription = request.ShortDescription?.Trim(),
            CategoryId = request.CategoryId,
            Images = request.Images ?? [],
            Tags = request.Tags ?? [],
            Price = request.Price,
            Stock = request.Stock,
            PublishToMarket = request.PublishToMarket,
            PublishToStore = request.PublishToStore,
            IsApproved = isAdmin,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateProductResult(product.Id, product.Name, product.IsApproved);
    }
}
