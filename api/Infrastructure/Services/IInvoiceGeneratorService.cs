using api.Domain.Entities;

namespace api.Infrastructure.Services;

public interface IInvoiceGeneratorService
{
    /// <summary>
    /// Sipariş için her VendorOrder'a (merchant'a) ait bir Invoice kaydı oluşturur,
    /// QuestPDF ile PDF üretir, Cloudinary'e yükler ve müşteriye e-posta gönderir.
    /// İdempotenttir: zaten faturası olan VendorOrder'lar atlanır. Siparişin tüm
    /// faturalarını (yeni üretilenler + önceden var olanlar) döner.
    /// </summary>
    Task<List<Invoice>> GenerateAndSaveAsync(Order order);

    /// <summary>
    /// Mevcut bir Invoice için PDF byte[] döner (indirme / önizleme).
    /// </summary>
    Task<byte[]> GeneratePdfBytesAsync(Invoice invoice);
}
