using api.Common.DTOs;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace api.Application.Queries.Fulfillment;

public record CalculateEtaQuery(
    Guid MerchantId,
    double DestLat,
    double DestLng,
    string ShippingRate = "Regular"
) : IRequest<ServiceResult<EtaResponseDto>>;

public class CalculateEtaQueryHandler
    : IRequestHandler<CalculateEtaQuery, ServiceResult<EtaResponseDto>>
{
    private readonly AppDbContext _context;
    private readonly IShippingCalculatorService _shippingCalculator;

    public CalculateEtaQueryHandler(
        AppDbContext context,
        IShippingCalculatorService shippingCalculator
    )
    {
        _context = context;
        _shippingCalculator = shippingCalculator;
    }

    public async Task<ServiceResult<EtaResponseDto>> Handle(
        CalculateEtaQuery request,
        CancellationToken cancellationToken
    )
    {
        var merchant = await _context.MerchantProfiles.FindAsync(
            [request.MerchantId],
            cancellationToken
        );
        if (merchant == null)
            return ServiceResult<EtaResponseDto>.Fail("Merchant bulunamadı.");

        var rate = Enum.TryParse<ShippingRate>(request.ShippingRate, true, out var parsedRate)
            ? parsedRate
            : ShippingRate.Regular;

        var distanceKm = _shippingCalculator.CalculateDistanceKm(
            merchant.Latitude,
            merchant.Longitude,
            request.DestLat,
            request.DestLng
        );

        var estimatedHours = _shippingCalculator.CalculateEtaHours(
            merchant.Latitude,
            merchant.Longitude,
            request.DestLat,
            request.DestLng,
            merchant.HandlingHours,
            rate
        );

        return ServiceResult<EtaResponseDto>.Ok(
            new EtaResponseDto
            {
                EstimatedHours = estimatedHours,
                EstimatedDeliveryDate = DateTime.UtcNow.AddHours(estimatedHours),
                DistanceKm = Math.Round(distanceKm, 2),
                ShippingRate = request.ShippingRate,
            }
        );
    }
}
