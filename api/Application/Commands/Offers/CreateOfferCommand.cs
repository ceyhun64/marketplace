using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Offers;

// ── Request ───────────────────────────────────────────────────────────────────
public record CreateOfferCommand(Guid ProductId, decimal Price, int Stock)
    : IRequest<CreateOfferResult>;

// ── Result ────────────────────────────────────────────────────────────────────
public record CreateOfferResult(Guid Id, string ProductName, decimal Price, int Stock);

// ── Handler ───────────────────────────────────────────────────────────────────
public class CreateOfferCommandHandler : IRequestHandler<CreateOfferCommand, CreateOfferResult>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateOfferCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateOfferResult> Handle(
        CreateOfferCommand request,
        CancellationToken cancellationToken
    )
    {
        // Merchant profilini bul
        var merchant =
            await _db.MerchantProfiles.FirstOrDefaultAsync(
                m => m.UserId == _currentUser.UserId,
                cancellationToken
            ) ?? throw new InvalidOperationException("Merchant profili bulunamadı.");

        // Ürünün onaylı ve var olduğunu doğrula
        var product =
            await _db.Products.FirstOrDefaultAsync(
                p => p.Id == request.ProductId && p.IsApproved,
                cancellationToken
            ) ?? throw new InvalidOperationException("Ürün bulunamadı veya henüz onaylanmadı.");

        // Aynı merchant aynı ürüne ikinci teklif veremez
        bool alreadyExists = await _db.ProductOffers.AnyAsync(
            o => o.ProductId == request.ProductId && o.MerchantId == merchant.Id,
            cancellationToken
        );

        if (alreadyExists)
            throw new InvalidOperationException("Bu ürün için zaten bir teklifiniz var.");

        var offer = new ProductOffer
        {
            Id = Guid.NewGuid(),
            ProductId = request.ProductId,
            MerchantId = merchant.Id,
            Price = request.Price,
            Stock = request.Stock,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.ProductOffers.Add(offer);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateOfferResult(offer.Id, product.Name, offer.Price, offer.Stock);
    }
}
