// api/Infrastructure/Services/LabelGeneratorService.cs
namespace api.Infrastructure.Services;

public class LabelGeneratorService : ILabelGeneratorService
{
    public Task<byte[]> GenerateLabelAsync(Guid orderId)
    {
        // QuestPDF / QRCoder ile implementasyon gelecek
        throw new NotImplementedException();
    }
}
