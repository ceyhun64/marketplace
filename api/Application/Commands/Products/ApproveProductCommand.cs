using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Products;

// ── Request ───────────────────────────────────────────────────────────────────
public record ApproveProductCommand(Guid ProductId, bool Approve) : IRequest<bool>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class ApproveProductCommandHandler : IRequestHandler<ApproveProductCommand, bool>
{
    private readonly AppDbContext _db;

    public ApproveProductCommandHandler(AppDbContext db) => _db = db;

    public async Task<bool> Handle(
        ApproveProductCommand request,
        CancellationToken cancellationToken
    )
    {
        var product = await _db.Products.FirstOrDefaultAsync(
            p => p.Id == request.ProductId,
            cancellationToken
        );

        if (product is null)
            return false;

        product.IsApproved = request.Approve;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
