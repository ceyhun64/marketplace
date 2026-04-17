using api.Domain.Entities;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;

namespace api.Application.Commands.Products;

public record CreateProductCommand(
    string Name,
    string Description,
    Guid CategoryId,
    List<string>? Images = null,
    List<string>? Tags = null
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
        // nameof ile tip-safe karşılaştırma
        bool isAdmin = _currentUser.Role is nameof(UserRole.Admin) or nameof(UserRole.SuperAdmin);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CategoryId = request.CategoryId,
            Images = request.Images ?? [],
            Tags = request.Tags ?? [],
            IsApproved = isAdmin,
            CreatedById = _currentUser.UserId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateProductResult(product.Id, product.Name, product.IsApproved);
    }
}
