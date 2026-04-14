namespace api.Infrastructure.Services;

public interface ILabelGeneratorService
{
    /// <summary>Generates a PDF shipping label and returns raw bytes.</summary>
    Task<byte[]> GenerateLabelAsync(Guid shipmentId);
}
