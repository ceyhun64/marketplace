using api.Domain.Entities;

namespace api.Infrastructure.Services;

public interface IInvoiceGeneratorService
{
    /// <summary>
    /// Sipariş için Invoice kaydı oluşturur, QuestPDF ile PDF üretir,
    /// Cloudinary'e yükler ve müşteriye e-posta gönderir.
    /// </summary>
    Task<Invoice> GenerateAndSaveAsync(Order order);

    /// <summary>
    /// Mevcut bir Invoice için PDF byte[] döner (indirme / önizleme).
    /// </summary>
    Task<byte[]> GeneratePdfBytesAsync(Invoice invoice);
}
