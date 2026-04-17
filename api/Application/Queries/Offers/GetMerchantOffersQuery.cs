using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Offers;

// ── Request ───────────────────────────────────────────────────────────────────
public record GetMerchantOffersQuery : IRequest<List<MerchantOfferDto>>;

// ── DTO ───────────────────────────────────────────────────────────────────────
public record MerchantOfferDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    decimal Price,
    int Stock,
    bool IsActive,
    DateTime CreatedAt
);

// ── Handler ───────────────────────────────────────────────────────────────────
public class GetMerchantOffersQueryHandler
    : IRequestHandler<GetMerchantOffersQuery, List<MerchantOfferDto>>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMerchantOffersQueryHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<MerchantOfferDto>> Handle(
        GetMerchantOffersQuery request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(
            m => m.UserId == _currentUser.UserId,
            cancellationToken
        );

        if (merchant is null)
            return [];

        return await _db
            .ProductOffers.Where(o => o.MerchantId == merchant.Id)
            .Include(o => o.Product)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new MerchantOfferDto(
                o.Id,
                o.ProductId,
                o.Product != null ? o.Product.Name : "",
                o.Price,
                o.Stock,
                o.IsActive,
                o.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}
