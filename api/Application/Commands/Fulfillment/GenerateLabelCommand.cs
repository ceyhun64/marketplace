using api.Common.DTOs;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Commands.Fulfillment;

public record GenerateLabelCommand(Guid ShipmentId) : IRequest<ServiceResult<string>>;

public class GenerateLabelCommandHandler
    : IRequestHandler<GenerateLabelCommand, ServiceResult<string>>
{
    private readonly AppDbContext _context;
    private readonly ILabelGeneratorService _labelGeneratorService;

    public GenerateLabelCommandHandler(
        AppDbContext context,
        ILabelGeneratorService labelGeneratorService
    )
    {
        _context = context;
        _labelGeneratorService = labelGeneratorService;
    }

    public async Task<ServiceResult<string>> Handle(
        GenerateLabelCommand request,
        CancellationToken cancellationToken
    )
    {
        var shipment = await _context
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o.Customer)
            .Include(s => s.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Offer)
                        .ThenInclude(o => o.Merchant)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
            return ServiceResult<string>.Fail("Shipment bulunamadı.");

        if (!string.IsNullOrEmpty(shipment.LabelUrl))
            return ServiceResult<string>.Ok(shipment.LabelUrl);

        // QuestPDF ile PDF oluştur, Cloudinary'e yükle
        var labelUrl = await _labelGeneratorService.GenerateAndUploadLabelAsync(shipment);

        shipment.LabelUrl = labelUrl;
        shipment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(labelUrl);
    }
}
