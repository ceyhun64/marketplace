// api/Infrastructure/Services/LabelGeneratorService.cs
namespace api.Infrastructure.Services;

using api.Domain.Entities;

public class LabelGeneratorService : ILabelGeneratorService
{
    public Task<byte[]> GenerateLabelAsync(Guid orderId)
    {
        // QuestPDF / QRCoder ile implementasyon gelecek
        throw new NotImplementedException();
    }

    public Task<string> GenerateAndUploadLabelAsync(Shipment shipment)
    {
        // TODO: QuestPDF + Cloudinary entegrasyonu
        var url = $"/labels/{shipment.Id}.pdf";
        return Task.FromResult(url);
    }
}
