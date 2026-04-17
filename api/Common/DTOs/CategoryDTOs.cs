namespace api.Common.DTOs;

// ── REQUEST DTOs ─────────────────────────────────────────────────────────────

public record CreateCategoryRequest(
    string Name,
    string Slug,
    Guid? ParentId,
    string? IconUrl,
    int SortOrder = 0
);

public record UpdateCategoryRequest(
    string? Name,
    string? Slug,
    Guid? ParentId,
    string? IconUrl,
    int? SortOrder
);

// ── RESPONSE DTOs ────────────────────────────────────────────────────────────

public record CategoryResponse(
    Guid Id,
    string Name,
    string Slug,
    Guid? ParentId,
    string? IconUrl,
    int SortOrder,
    int ProductCount,
    List<CategoryResponse> SubCategories
);

public record CategoryTreeResponse(
    Guid Id,
    string Name,
    string Slug,
    string? IconUrl,
    int SortOrder,
    List<CategoryTreeResponse> Children
);

public record CategoryWithProductsResponse(
    Guid Id,
    string Name,
    string Slug,
    string? IconUrl,
    List<CategoryTreeResponse> SubCategories,
    PagedProductResponse Products
);

public record CategoryListItemResponse(
    Guid Id,
    string Name,
    string Slug,
    Guid? ParentId,
    string? IconUrl,
    int ProductCount,
    int SubCategoryCount
);
