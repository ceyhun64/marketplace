namespace api.Common.DTOs;

// ── REQUEST DTOs ─────────────────────────────────────────────────────────────

public record CreateMerchantRequest(
    string Email,
    string Password,
    string StoreName,
    string Slug,
    double Latitude,
    double Longitude,
    int HandlingHours = 24,
    string? PhoneNumber = null,
    string? Description = null,
    string? LogoUrl = null,
    string? BannerUrl = null
);

public record UpdateMerchantProfileRequest(
    string? StoreName,
    string? Description,
    double? Latitude,
    double? Longitude,
    int? HandlingHours,
    string? PhoneNumber,
    string? LogoUrl,
    string? BannerUrl
);

public record SuspendMerchantRequest(
    string Reason
);

// ── RESPONSE DTOs ────────────────────────────────────────────────────────────

public record MerchantResponse(
    Guid Id,
    Guid UserId,
    string Email,
    string StoreName,
    string Slug,
    double Latitude,
    double Longitude,
    int HandlingHours,
    string? PhoneNumber,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    bool IsSuspended,
    string? CurrentPlan,
    DateTime? PlanExpiresAt,
    int ActiveOfferCount,
    DateTime CreatedAt
);

public record MerchantListItemResponse(
    Guid Id,
    string StoreName,
    string Slug,
    string Email,
    bool IsSuspended,
    string? CurrentPlan,
    int ActiveOfferCount,
    DateTime CreatedAt
);

public record MerchantProfileResponse(
    Guid Id,
    string StoreName,
    string Slug,
    double Latitude,
    double Longitude,
    int HandlingHours,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    string? CurrentPlan,
    DateTime? PlanExpiresAt
);

public record StorePublicResponse(
    Guid Id,
    string StoreName,
    string Slug,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    double AverageRating,
    int TotalProducts,
    DateTime MemberSince
);

public record MerchantAnalyticsResponse(
    decimal TotalRevenue,
    int TotalOrders,
    decimal MarketplaceRevenue,
    decimal EStoreRevenue,
    int MarketplaceOrders,
    int EStoreOrders,
    List<DailySalesItem> DailySales,
    List<TopProductItem> TopProducts
);

public record DailySalesItem(
    DateOnly Date,
    decimal Revenue,
    int OrderCount
);

public record TopProductItem(
    Guid ProductId,
    string ProductName,
    int UnitsSold,
    decimal Revenue
);
