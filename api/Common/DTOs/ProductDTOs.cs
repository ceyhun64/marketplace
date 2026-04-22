namespace api.Common.DTOs;

// ── REQUEST DTOs ─────────────────────────────────────────────────────────────

public class ProductDto
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public Guid CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? MerchantStoreName { get; set; }
    public List<string> Images { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public record CreateProductRequest(
    string Name,
    string Description,
    Guid CategoryId,
    List<string> Images,
    List<string> Tags
);

public record UpdateProductRequest(
    string? Name,
    string? Description,
    Guid? CategoryId,
    List<string>? Images,
    List<string>? Tags
);

public record CreateOfferRequest(
    Guid ProductId,
    decimal Price,
    int Stock,
    bool PublishToMarket,
    bool PublishToStore
);

public record UpdateOfferRequest(
    decimal? Price,
    int? Stock,
    bool? PublishToMarket,
    bool? PublishToStore
);

public record PublishToggleRequest(bool PublishToMarket, bool PublishToStore);

// ── RESPONSE DTOs ────────────────────────────────────────────────────────────

public record ProductResponse(
    Guid Id,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    List<string> Images,
    List<string> Tags,
    int OfferCount,
    DateTime CreatedAt
);

public record ProductListResponse(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName,
    List<string> Images,
    decimal? LowestPrice,
    int OfferCount
);

public record ProductOfferResponse(
    Guid Id,
    Guid ProductId,
    string ProductName,
    Guid MerchantId,
    string MerchantStoreName,
    decimal Price,
    int Stock,
    bool PublishToMarket,
    bool PublishToStore,
    double Rating,
    DateTime CreatedAt
);

public record BuyBoxResponse(
    Guid OfferId,
    Guid MerchantId,
    string MerchantStoreName,
    string MerchantSlug,
    decimal Price,
    int Stock,
    double Rating,
    DateTime EstimatedDelivery,
    double Score
);

public record ProductDetailResponse(
    Guid Id,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    List<string> Images,
    List<string> Tags,
    BuyBoxResponse? BuyBox,
    List<ProductOfferResponse> OtherOffers,
    DateTime CreatedAt
);

public record PagedProductResponse(
    List<ProductListResponse> Items,
    int TotalCount,
    int Page,
    int Limit,
    int TotalPages
);
