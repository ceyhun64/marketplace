using api.Common.DTOs;

namespace api.Infrastructure.Services;

public interface IBuyBoxService
{
    /// <summary>En iyi teklifi (Buy Box kazananı) döner. Müşteri koordinatı
    /// verilirse ETA hesabı ona göre yapılır, verilmezse sabit 48 saat kullanılır.</summary>
    Task<BuyBoxOfferDto?> GetWinningOfferAsync(
        Guid productId,
        double? customerLat = null,
        double? customerLng = null
    );

    /// <summary>Ürünün tüm aktif tekliflerini fiyata göre sıralı döner
    /// (ProductDetail sayfasındaki "Diğer Satıcılar" listesi için).</summary>
    Task<List<BuyBoxOfferDto>> GetAllOffersAsync(
        Guid productId,
        double? customerLat = null,
        double? customerLng = null
    );
}
