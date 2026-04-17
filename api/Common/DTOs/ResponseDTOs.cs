namespace api.Common.DTOs;

// ── Auth ─────────────────────────────────────────────────────────────────────
public record LoginResponseDto(string AccessToken, string RefreshToken, UserDto User);

public record UserDto(Guid Id, string Email, string Role, bool IsVerified, Guid? MerchantId);

// ── Category ─────────────────────────────────────────────────────────────────
public record CategoryDto(Guid Id, string Name, string Slug, Guid? ParentId, string? ParentName);

// ── Product ───────────────────────────────────────────────────────────────────
public record ProductDto(
    Guid Id,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    List<string> Images,
    List<string> Tags,
    bool IsApproved,
    int OfferCount,
    DateTime CreatedAt
);

// ── Offer ────────────────────────────────────────────────────────────────────
public record OfferDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    Guid MerchantId,
    string MerchantName,
    decimal Price,
    int Stock,
    bool IsActive,
    double Rating,
    DateTime CreatedAt
);

// ── Merchant ─────────────────────────────────────────────────────────────────
public record MerchantDto(
    Guid Id,
    Guid UserId,
    string StoreName,
    string Slug,
    string Email,
    bool IsActive,
    int HandlingHours,
    DateTime? CreatedAt
);

// ── Order ────────────────────────────────────────────────────────────────────
public record OrderDto(
    Guid Id,
    string CustomerName,
    string CustomerEmail,
    string MerchantName,
    List<OrderItemDto> Items,
    decimal TotalAmount,
    string Status,
    string Source,
    string ShippingRate,
    DateTime CreatedAt
);

public record OrderItemDto(Guid Id, string ProductName, int Quantity, decimal UnitPrice);

// ── Courier ───────────────────────────────────────────────────────────────────
public record CourierDto(
    Guid Id,
    Guid UserId,
    string Name,
    string Email,
    string? Phone,
    bool IsActive,
    int ActiveShipmentCount,
    int TotalDelivered,
    DateTime CreatedAt
);
