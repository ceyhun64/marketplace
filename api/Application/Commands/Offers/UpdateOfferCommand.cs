using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Offers;

// ── Request ───────────────────────────────────────────────────────────────────
public record UpdateOfferCommand(Guid OfferId, decimal? Price, int? Stock, bool? IsActive)
    : IRequest<bool>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class UpdateOfferCommandHandler : IRequestHandler<UpdateOfferCommand, bool>
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateOfferCommandHandler(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(UpdateOfferCommand request, CancellationToken cancellationToken)
    {
        var merchant =
            await _db.MerchantProfiles.FirstOrDefaultAsync(
                m => m.UserId == _currentUser.UserId,
                cancellationToken
            ) ?? throw new InvalidOperationException("Merchant profili bulunamadı.");

        var offer = await _db.ProductOffers.FirstOrDefaultAsync(
            o => o.Id == request.OfferId && o.MerchantId == merchant.Id,
            cancellationToken
        );

        if (offer is null)
            return false;

        if (request.Price.HasValue)
            offer.Price = request.Price.Value;
        if (request.Stock.HasValue)
            offer.Stock = request.Stock.Value;
        if (request.IsActive.HasValue)
            offer.IsActive = request.IsActive.Value;

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
