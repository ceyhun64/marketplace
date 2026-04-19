namespace api.Common.DTOs;

public class OfferDtos
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public Guid MerchantId { get; set; }
    public string MerchantStoreName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool PublishToMarket { get; set; }
    public bool PublishToStore { get; set; }
    public double Rating { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateOfferDto
{
    public Guid ProductId { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool PublishToMarket { get; set; } = false;
    public bool PublishToStore { get; set; } = true;
}

public class UpdateOfferDto
{
    public decimal? Price { get; set; }
    public int? Stock { get; set; }
}

public class PublishOfferDto
{
    public bool PublishToMarket { get; set; }
    public bool PublishToStore { get; set; }
}

public class BuyBoxOfferDto
{
    public Guid OfferId { get; set; }
    public Guid MerchantId { get; set; }
    public string MerchantStoreName { get; set; } = string.Empty;
    public string MerchantSlug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public double Rating { get; set; }
    public double Score { get; set; }
    public int EstimatedDeliveryHours { get; set; }
    public DateTime EstimatedDeliveryDate { get; set; }
}
