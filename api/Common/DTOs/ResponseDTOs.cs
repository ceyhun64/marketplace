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

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public ApiResponse(T data)
    {
        Success = true;
        Data = data;
    }

    public ApiResponse(string message)
    {
        Success = false;
        Message = message;
    }
}

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
