using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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

    // ── Herkese açık API ──────────────────────────────────────────────────────

    public async Task<byte[]> GenerateLabelAsync(Guid shipmentId)
    {
        var shipment = await LoadShipmentAsync(shipmentId);
        if (shipment is null)
            throw new InvalidOperationException($"Shipment {shipmentId} bulunamadı.");
        return BuildLabelPdf(shipment);
    }

    public async Task<string> GenerateAndUploadLabelAsync(Shipment shipment)
    {
        // Navigation property'ler yüklü değilse yeniden çek
        if (shipment.Order is null)
            shipment = await LoadShipmentAsync(shipment.Id) ?? shipment;

        var pdfBytes = BuildLabelPdf(shipment);
        var url = await UploadLabelAsync(pdfBytes, shipment.TrackingNumber);

        shipment.LabelUrl = url;
        await _db.SaveChangesAsync();

        return url;
    }

    // ── QuestPDF Kargo Etiketi ────────────────────────────────────────────────

    private static byte[] BuildLabelPdf(Shipment shipment)
    {
        var qrBytes = GenerateQrCode(shipment.TrackingNumber);
        var order = shipment.Order;
        var courier = shipment.Courier;
        var merchant = order?.Items.FirstOrDefault()?.MerchantId; // sadece ID lazım

        return Document
            .Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A6.Landscape());
                    page.Margin(16);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                    page.Content()
                        .Border(1.5f)
                        .BorderColor(Colors.Black)
                        .Column(col =>
                        {
                            // ── Başlık bandı ────────────────────────────────
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
                                                .Text("KARGO ETİKETİ")
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
                                            inner
                                                .Item()
                                                .Text(
                                                    shipment.Order?.ShippingRate.ToString()
                                                        ?? "REGULAR"
                                                )
                                                .FontColor(Colors.Orange.Medium)
                                                .Bold()
                                                .FontSize(11);
                                            inner
                                                .Item()
                                                .Text(
                                                    $"ETA: {shipment.EstimatedDelivery:dd.MM.yyyy}"
                                                )
                                                .FontColor(Colors.Grey.Lighten3)
                                                .FontSize(8);
                                        });
                                });

                            // ── Ana içerik ───────────────────────────────────
                            col.Item()
                                .Padding(10)
                                .Row(row =>
                                {
                                    // Sol: Adres bilgileri
                                    row.RelativeItem(3)
                                        .Column(addr =>
                                        {
                                            // Gönderici
                                            addr.Item()
                                                .Text("GÖNDERİCİ")
                                                .FontSize(7)
                                                .FontColor(Colors.Grey.Darken2)
                                                .Bold();
                                            addr.Item()
                                                .Text(
                                                    order
                                                        ?.Items.FirstOrDefault()
                                                        ?.MerchantId.ToString()[..8]
                                                        ?? "Merchant"
                                                )
                                                .Bold();
                                            addr.Item().PaddingBottom(10).Text(" ");

                                            // Alıcı
                                            addr.Item()
                                                .Text("ALICI")
                                                .FontSize(7)
                                                .FontColor(Colors.Grey.Darken2)
                                                .Bold();
                                            addr.Item()
                                                .Text(order?.RecipientName ?? "-")
                                                .Bold()
                                                .FontSize(11);
                                            addr.Item()
                                                .Text(order?.RecipientPhone ?? "-")
                                                .FontColor(Colors.Grey.Darken1);
                                            addr.Item()
                                                .Text($"{order?.AddressLine}, {order?.District}");
                                            addr.Item()
                                                .Text(
                                                    $"{order?.City} {order?.PostalCode} / {order?.Country}"
                                                )
                                                .Bold();

                                            // Kurye
                                            if (courier is not null)
                                            {
                                                addr.Item().PaddingTop(8).Text(" ");
                                                addr.Item()
                                                    .Text("KURYE")
                                                    .FontSize(7)
                                                    .FontColor(Colors.Grey.Darken2)
                                                    .Bold();
                                                addr.Item()
                                                    .Text(
                                                        $"{courier.User?.FirstName} {courier.User?.LastName}"
                                                    )
                                                    .Bold();
                                                addr.Item()
                                                    .Text(
                                                        $"{courier.VehicleType} — {courier.PlateNumber}"
                                                    )
                                                    .FontColor(Colors.Grey.Darken1);
                                            }
                                        });

                                    // Sağ: QR kodu
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
                                                .Text("Takip için tarat")
                                                .FontSize(7)
                                                .FontColor(Colors.Grey.Darken1);
                                        });
                                });

                            // ── Alt bant ─────────────────────────────────────
                            col.Item()
                                .Background(Colors.Grey.Lighten3)
                                .Padding(6)
                                .Row(row =>
                                {
                                    row.RelativeItem()
                                        .Text(
                                            $"Sipariş: {order?.Id.ToString()[..8].ToUpper() ?? "-"}"
                                        )
                                        .FontSize(8)
                                        .FontColor(Colors.Grey.Darken2);
                                    row.AutoItem()
                                        .Text(
                                            $"Oluşturuldu: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC"
                                        )
                                        .FontSize(8)
                                        .FontColor(Colors.Grey.Darken2);
                                });
                        });
                });
            })
            .GeneratePdf();
    }

    // ── QR Kodu ───────────────────────────────────────────────────────────────

    private static byte[] GenerateQrCode(string trackingNumber)
    {
        var appUrl = "https://platform.com"; // config'den okunabilir
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(
            $"{appUrl}/track/{trackingNumber}",
            QRCodeGenerator.ECCLevel.M
        );
        using var qrCode = new PngByteQRCode(qrData);
        return qrCode.GetGraphic(4, [0, 0, 0], [255, 255, 255]);
    }

    // ── Cloudinary Yükleme ────────────────────────────────────────────────────

    private async Task<string> UploadLabelAsync(byte[] pdfBytes, string trackingNumber)
    {
        var cloudName = _config["Cloudinary:CloudName"];
        var apiKey = _config["Cloudinary:ApiKey"];
        var apiSecret = _config["Cloudinary:ApiSecret"];

        if (string.IsNullOrEmpty(cloudName))
            return $"/labels/{trackingNumber}.pdf";

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/raw/upload";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var publicId = $"labels/{trackingNumber}";

        var signatureString = $"public_id={publicId}&timestamp={timestamp}{apiSecret}";
        var signature = ComputeSha1(signatureString);

        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(pdfBytes), "file", $"{trackingNumber}.pdf");
        content.Add(new StringContent(apiKey!), "api_key");
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
                _logger.LogWarning("Label CDN yükleme başarısız: {Status}", response.StatusCode);
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
            _logger.LogError(ex, "Label Cloudinary yükleme exception: {Tracking}", trackingNumber);
            return $"/labels/{trackingNumber}.pdf";
        }
    }

    private async Task<Shipment?> LoadShipmentAsync(Guid shipmentId) =>
        await _db
            .Shipments.Include(s => s.Order)
                .ThenInclude(o => o!.Items)
            .Include(s => s.Courier)
                .ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

    private static string ComputeSha1(string input)
    {
        var bytes = System.Security.Cryptography.SHA1.HashData(
            System.Text.Encoding.UTF8.GetBytes(input)
        );
        return Convert.ToHexString(bytes).ToLower();
    }
}
