using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Products;

public record GetMerchantProductsQuery : IRequest<List<MerchantProductDto>>;

public record MerchantProductDto(
    Guid Id,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    bool IsApproved,
    int OfferCount,
    DateTime CreatedAt
);

public class GetMerchantProductsQueryHandler
    : IRequestHandler<GetMerchantProductsQuery, List<MerchantProductDto>>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMerchantProductsQueryHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<MerchantProductDto>> Handle(
        GetMerchantProductsQuery request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _db.MerchantProfiles.FirstOrDefaultAsync(
            m => m.UserId == _currentUser.UserId,
            cancellationToken
        );

        if (merchant is null)
            return [];

        var merchantId = merchant.Id; // ← closure için local variable, EF Core translator için kritik

        var offeredProductIds = await _db
            .ProductOffers.Where(o => o.MerchantId == merchantId)
            .Select(o => o.ProductId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return await _db
            .Products.Include(p => p.Category)
            .Where(p => p.CreatedById == _currentUser.UserId || offeredProductIds.Contains(p.Id))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new MerchantProductDto(
                p.Id,
                p.Name,
                p.Description,
                p.CategoryId,
                p.Category != null ? p.Category.Name : "",
                p.IsApproved,
                // ← Include + Count yerine subquery ile say — SQL'e çevrilir
                p.Offers.Count(o => o.MerchantId == merchantId && !o.IsDeleted),
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}
