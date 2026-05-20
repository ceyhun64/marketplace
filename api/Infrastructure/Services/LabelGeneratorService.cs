using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace api.Infrastructure.Services;

public class LabelGeneratorService : ILabelGeneratorService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<LabelGeneratorService> _logger;

    public LabelGeneratorService(
        AppDbContext db,
        IConfiguration config,
        ILogger<LabelGeneratorService> logger
    )
    {
        _db = db;
        _config = config;
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    // ── Public API ───────────────────────────────────────────────────────────

    public async Task<byte[]> GenerateLabelAsync(Guid shipmentId)
    {
        var shipment = await LoadShipmentAsync(shipmentId);
        if (shipment is null)
            throw new InvalidOperationException($"Shipment {shipmentId} not found.");

        return BuildLabelPdf(shipment, _config["PLATFORM_URL"] ?? "https://platform.com");
    }

    public async Task<string> GenerateAndUploadLabelAsync(Shipment shipment)
    {
        // Reload if navigation properties are not populated
        if (shipment.Order is null)
            shipment = await LoadShipmentAsync(shipment.Id) ?? shipment;

        var platformUrl = _config["PLATFORM_URL"] ?? "https://platform.com";
        var pdfBytes = BuildLabelPdf(shipment, platformUrl);
        var url = await UploadLabelAsync(pdfBytes, shipment.TrackingNumber);

        shipment.LabelUrl = url;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "✅ Shipping label generated and uploaded: TrackingNo={TrackingNo} Url={Url}",
            shipment.TrackingNumber,
            url
        );

        return url;
    }

    // ── QuestPDF Shipping Label ───────────────────────────────────────────────

    private static byte[] BuildLabelPdf(Shipment shipment, string platformUrl)
    {
        var qrBytes = GenerateQrCode(shipment.TrackingNumber, platformUrl);
        var order = shipment.Order;
        var courier = shipment.Courier;

        // Merchant info: access merchant profile via order items
        var merchant = order?.Items
            .Select(i => i.Product?.Merchant)
            .FirstOrDefault(m => m != null);

        var senderName = merchant?.StoreName ?? "Seller";
        var senderCity = merchant?.City ?? "";
        var senderAddress = merchant?.Address ?? "";

        var shippingRateLabel = order?.ShippingRate.ToString().ToUpper() ?? "REGULAR";
        var eta = shipment.EstimatedDelivery.ToLocalTime().ToString("dd.MM.yyyy");

        return Document
            .Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A6.Landscape());
                    page.Margin(12);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                    page.Content()
                        .Border(1.5f)
                        .BorderColor(Colors.Black)
                        .Column(col =>
                        {
                            // ── Header band ──────────────────────────────────
                            col.Item()
                                .Background(Colors.Black)
                                .Padding(8)
                                .Row(row =>
                                {
                                    row.RelativeItem()
                                        .Column(inner =>
                                        {
                                            inner
                                                .Item()
                                                .Text("SHIPPING LABEL")
                                                .FontColor(Colors.White)
                                                .Bold()
                                                .FontSize(13);

                                            inner
                                                .Item()
                                                .Text(shipment.TrackingNumber)
                                                .FontColor(Colors.Grey.Lighten2)
                                                .FontSize(10)
                                                .FontFamily("Courier New");
                                        });

                                    row.AutoItem()
                                        .AlignRight()
                                        .Column(inner =>
                                        {
                                            // Orange for EXPRESS, grey for REGULAR
                                            var rateColor =
                                                shippingRateLabel == "EXPRESS"
                                                    ? Colors.Orange.Medium
                                                    : Colors.Grey.Lighten2;

                                            inner
                                                .Item()
                                                .Text(shippingRateLabel)
                                                .FontColor(rateColor)
                                                .Bold()
                                                .FontSize(11);

                                            inner
                                                .Item()
                                                .Text($"ETA: {eta}")
                                                .FontColor(Colors.Grey.Lighten3)
                                                .FontSize(8);
                                        });
                                });

                            // ── Main content ─────────────────────────────────
                            col.Item()
                                .Padding(10)
                                .Row(row =>
                                {
                                    // Left: Address information
                                    row.RelativeItem(3)
                                        .Column(addr =>
                                        {
                                            // Sender (Merchant)
                                            addr.Item()
                                                .Text("SENDER")
                                                .FontSize(7)
                                                .FontColor(Colors.Grey.Darken2)
                                                .Bold();

                                            addr.Item()
                                                .Text(senderName)
                                                .Bold()
                                                .FontSize(10);

                                            if (!string.IsNullOrEmpty(senderAddress))
                                                addr.Item()
                                                    .Text(senderAddress)
                                                    .FontColor(Colors.Grey.Darken1)
                                                    .FontSize(8);

                                            if (!string.IsNullOrEmpty(senderCity))
                                                addr.Item()
                                                    .Text(senderCity)
                                                    .FontColor(Colors.Grey.Darken1)
                                                    .FontSize(8);

                                            addr.Item().PaddingBottom(10).Text(" ");

                                            // Recipient (Customer)
                                            addr.Item()
                                                .Text("RECIPIENT")
                                                .FontSize(7)
                                                .FontColor(Colors.Grey.Darken2)
                                                .Bold();

                                            addr.Item()
                                                .Text(order?.RecipientName ?? "-")
                                                .Bold()
                                                .FontSize(11);

                                            if (!string.IsNullOrEmpty(order?.RecipientPhone))
                                                addr.Item()
                                                    .Text(order.RecipientPhone)
                                                    .FontColor(Colors.Grey.Darken1);

                                            addr.Item()
                                                .Text(
                                                    BuildAddressLine(
                                                        order?.AddressLine,
                                                        order?.District
                                                    )
                                                );

                                            addr.Item()
                                                .Text(
                                                    BuildCityLine(
                                                        order?.City,
                                                        order?.PostalCode,
                                                        order?.Country
                                                    )
                                                )
                                                .Bold();

                                            // Courier information
                                            if (courier is not null)
                                            {
                                                addr.Item().PaddingTop(8).Text(" ");
                                                addr.Item()
                                                    .Text("COURIER")
                                                    .FontSize(7)
                                                    .FontColor(Colors.Grey.Darken2)
                                                    .Bold();

                                                addr.Item()
                                                    .Text(
                                                        $"{courier.User?.FirstName} {courier.User?.LastName}".Trim()
                                                    )
                                                    .Bold();

                                                if (!string.IsNullOrEmpty(courier.PlateNumber))
                                                    addr.Item()
                                                        .Text(
                                                            $"{courier.VehicleType} — {courier.PlateNumber}"
                                                        )
                                                        .FontColor(Colors.Grey.Darken1);
                                            }
                                        });

                                    // Right: QR code
                                    row.AutoItem()
                                        .AlignRight()
                                        .AlignBottom()
                                        .Width(90)
                                        .Column(qrCol =>
                                        {
                                            qrCol.Item().Image(qrBytes).FitWidth();
                                            qrCol
                                                .Item()
                                                .AlignCenter()
                                                .Text("Scan to track")
                                                .FontSize(7)
                                                .FontColor(Colors.Grey.Darken1);
                                        });
                                });

                            // ── Footer band ──────────────────────────────────
                            col.Item()
                                .Background(Colors.Grey.Lighten3)
                                .Padding(6)
                                .Row(row =>
                                {
                                    row.RelativeItem()
                                        .Text(
                                            $"Order: {order?.Id.ToString()[..8].ToUpper() ?? "-"}"
                                        )
                                        .FontSize(8)
                                        .FontColor(Colors.Grey.Darken2);

                                    row.AutoItem()
                                        .Text(
                                            $"Generated: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC"
                                        )
                                        .FontSize(8)
                                        .FontColor(Colors.Grey.Darken2);
                                });
                        });
                });
            })
            .GeneratePdf();
    }

    // ── QR Code ──────────────────────────────────────────────────────────────

    private static byte[] GenerateQrCode(string trackingNumber, string platformUrl)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(
            $"{platformUrl}/track/{trackingNumber}",
            QRCodeGenerator.ECCLevel.M
        );
        using var qrCode = new PngByteQRCode(qrData);
        return qrCode.GetGraphic(4, [0, 0, 0], [255, 255, 255]);
    }

    // ── Cloudinary Upload ─────────────────────────────────────────────────────

    private async Task<string> UploadLabelAsync(byte[] pdfBytes, string trackingNumber)
    {
        var cloudName = _config["Cloudinary:CloudName"] ?? _config["CLOUDINARY_CLOUD_NAME"];
        var apiKey = _config["Cloudinary:ApiKey"] ?? _config["CLOUDINARY_API_KEY"];
        var apiSecret = _config["Cloudinary:ApiSecret"] ?? _config["CLOUDINARY_API_SECRET"];

        if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            _logger.LogWarning(
                "⚠️  Cloudinary configuration missing — label saved to local path: {TrackingNo}",
                trackingNumber
            );
            return $"/labels/{trackingNumber}.pdf";
        }

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/raw/upload";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var publicId = $"labels/{trackingNumber}";

        // HMAC-SHA1 signature
        var signatureString = $"public_id={publicId}&timestamp={timestamp}{apiSecret}";
        var signature = ComputeSha1(signatureString);

        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(pdfBytes), "file", $"{trackingNumber}.pdf");
        content.Add(new StringContent(apiKey), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(publicId), "public_id");
        content.Add(new StringContent(signature), "signature");
        content.Add(new StringContent("raw"), "resource_type");

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            var response = await http.PostAsync(uploadUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "⚠️  Cloudinary upload failed: {Status} — {Error}",
                    (int)response.StatusCode,
                    err
                );
                return $"/labels/{trackingNumber}.pdf";
            }

            var json = System.Text.Json.JsonDocument.Parse(
                await response.Content.ReadAsStringAsync()
            );

            return json.RootElement.GetProperty("secure_url").GetString()
                ?? $"/labels/{trackingNumber}.pdf";
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "❌ Cloudinary upload exception: TrackingNo={TrackingNo}",
                trackingNumber
            );
            return $"/labels/{trackingNumber}.pdf";
        }
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    private async Task<Shipment?> LoadShipmentAsync(Guid shipmentId) =>
        await _db
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o!.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p!.Merchant)
            .Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

    private static string BuildAddressLine(string? addressLine, string? district)
    {
        var parts = new[] { addressLine, district }
            .Where(s => !string.IsNullOrEmpty(s));
        return string.Join(", ", parts);
    }

    private static string BuildCityLine(string? city, string? postalCode, string? country)
    {
        var parts = new[] { city, postalCode, country }
            .Where(s => !string.IsNullOrEmpty(s));
        return string.Join(" / ", parts);
    }

    private static string ComputeSha1(string input)
    {
        var bytes = System.Security.Cryptography.SHA1.HashData(
            System.Text.Encoding.UTF8.GetBytes(input)
        );
        return Convert.ToHexString(bytes).ToLower();
    }
}
