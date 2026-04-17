using api.Domain.Entities;
using api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Categories;

// ── Request ───────────────────────────────────────────────────────────────────
public record CreateCategoryCommand(string Name, string Slug, Guid? ParentId = null)
    : IRequest<CreateCategoryResult>;

// ── Result ────────────────────────────────────────────────────────────────────
public record CreateCategoryResult(Guid Id, string Name, string Slug);

// ── Handler ───────────────────────────────────────────────────────────────────
public class CreateCategoryCommandHandler
    : IRequestHandler<CreateCategoryCommand, CreateCategoryResult>
{
    private readonly AppDbContext _db;

    public CreateCategoryCommandHandler(AppDbContext db) => _db = db;

    public async Task<CreateCategoryResult> Handle(
        CreateCategoryCommand request,
        CancellationToken cancellationToken
    )
    {
        bool slugExists = await _db.Categories.AnyAsync(
            c => c.Slug == request.Slug,
            cancellationToken
        );

        if (slugExists)
            throw new InvalidOperationException($"'{request.Slug}' slug'ı zaten kullanımda.");

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = request.Slug,
            ParentId = request.ParentId,
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateCategoryResult(category.Id, category.Name, category.Slug);
    }
}
