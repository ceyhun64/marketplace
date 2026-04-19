namespace api.Common.DTOs;

public class BuyBoxResultDto
{
    public Guid OfferId { get; set; }
    public Guid MerchantId { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public string MerchantSlug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public double Rating { get; set; }
    public double EstimatedDeliveryHours { get; set; }
    public double Score { get; set; }
}
