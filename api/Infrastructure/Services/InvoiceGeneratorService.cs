using api.Domain.Entities;
using api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace api.Infrastructure.Services;

public class InvoiceGeneratorService : IInvoiceGeneratorService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notification;
    private readonly IConfiguration _config;
    private readonly ILogger<InvoiceGeneratorService> _logger;

    public InvoiceGeneratorService(
        AppDbContext db,
        INotificationService notification,
        IConfiguration config,
        ILogger<InvoiceGeneratorService> logger
    )
    {
        _db = db;
        _notification = notification;
        _config = config;
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    // ── Herkese açık API ──────────────────────────────────────────────────────

    public async Task<Invoice> GenerateAndSaveAsync(Order order)
    {
        var fullOrder = await _db
            .Orders
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == order.Id) ?? order;

        // Merchant'ı OrderItem'dan bul (ilk item'ın MerchantId'si)
        var firstMerchantId = fullOrder.Items.FirstOrDefault()?.MerchantId;
        var merchant = firstMerchantId.HasValue
            ? await _db.MerchantProfiles
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == firstMerchantId.Value)
            : null;

        var subTotal = fullOrder.Items.Sum(i => i.LineTotal);
        var vatRate = 0.20m;
        var vatAmount = Math.Round(subTotal * vatRate, 2);
        var total = subTotal + vatAmount + fullOrder.ShippingAmount;

        var invoiceNumber = await GenerateInvoiceNumberAsync();

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            OrderId = fullOrder.Id,
            MerchantId = merchant?.Id ?? Guid.Empty,
            CustomerId = fullOrder.CustomerId,
            SubTotal = subTotal,
            VatRate = vatRate,
            VatAmount = vatAmount,
            ShippingAmount = fullOrder.ShippingAmount,
            TotalAmount = total,
            MerchantStoreName = merchant?.StoreName ?? "Marketplace",
            MerchantAddress = $"{merchant?.Address}, {merchant?.City}",
            CustomerFullName =
                $"{fullOrder.Customer?.FirstName} {fullOrder.Customer?.LastName}".Trim(),
            CustomerEmail = fullOrder.Customer?.Email ?? string.Empty,
            CustomerAddress =
                $"{fullOrder.RecipientName} — {fullOrder.AddressLine}, {fullOrder.District}, {fullOrder.City}",
            IssuedAt = DateTime.UtcNow,
        };

        _db.Invoices.Add(invoice);

        // Muhasebe kaydı
        _db.AccountingEntries.Add(new AccountingEntry
        {
            InvoiceId = invoice.Id,
            OrderId = fullOrder.Id,
            MerchantId = merchant?.Id ?? Guid.Empty,
            EntryType = "SALE",
            Amount = total,
            Description =
                $"Sipariş #{fullOrder.Id.ToString()[..8].ToUpper()} — {fullOrder.Items.Count} ürün",
            PaymentReference = fullOrder.PaymentId,
        });

        await _db.SaveChangesAsync();

        // PDF üret ve CDN'e yükle
        try
        {
            var pdfBytes = await GeneratePdfBytesAsync(invoice, fullOrder.Items.ToList());
            var pdfUrl = await UploadToCloudinaryAsync(pdfBytes, invoice.InvoiceNumber);
            invoice.PdfUrl = pdfUrl;
            invoice.IsSent = true;
            await _db.SaveChangesAsync();

            if (!string.IsNullOrEmpty(invoice.CustomerEmail))
            {
                await _notification.SendEmailAsync(
                    invoice.CustomerEmail,
                    $"Faturanız Hazır — {invoice.InvoiceNumber}",
                    BuildInvoiceEmailBody(invoice)
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatura PDF üretimi/yükleme başarısız: {InvoiceId}", invoice.Id);
        }

        return invoice;
    }

    public Task<byte[]> GeneratePdfBytesAsync(Invoice invoice)
    {
        // Navigation property üzerinden items'a eriş (controller'dan çağrı için)
        var items = invoice.Order?.Items?.ToList() ?? [];
        return GeneratePdfBytesAsync(invoice, items);
    }

    // ── QuestPDF 2026 implementasyonu ────────────────────────────────────────

    private Task<byte[]> GeneratePdfBytesAsync(Invoice invoice, List<OrderItem> items)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Element(c => ComposeHeader(c, invoice));
                page.Content().Element(c => ComposeContent(c, invoice, items));
                page.Footer().Element(c => ComposeFooter(c, invoice));
            });
        });

        var bytes = document.GeneratePdf();
        return Task.FromResult(bytes);
    }

    // ── Bölüm: Header ────────────────────────────────────────────────────────

    private static void ComposeHeader(IContainer container, Invoice invoice)
    {
        container
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingBottom(12)
            .Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("FATURA").FontSize(22).Bold().FontColor(Colors.Black);
                    col.Item()
                        .Text(invoice.InvoiceNumber)
                        .FontSize(11)
                        .FontColor(Colors.Grey.Darken2);
                });

                row.RelativeItem().AlignRight().Column(col =>
                {
                    col.Item().Text(invoice.MerchantStoreName).Bold().FontSize(12);
                    col.Item()
                        .Text(invoice.MerchantAddress)
                        .FontColor(Colors.Grey.Darken1);
                    col.Item()
                        .Text($"Tarih: {invoice.IssuedAt:dd.MM.yyyy}")
                        .FontColor(Colors.Grey.Darken1);
                });
            });
    }

    // ── Bölüm: Content ───────────────────────────────────────────────────────

    private static void ComposeContent(IContainer container, Invoice invoice, List<OrderItem> items)
    {
        container.Column(col =>
        {
            // Müşteri bilgisi
            col.Item()
                .PaddingTop(20)
                .Background(Colors.Grey.Lighten4)
                .Padding(12)
                .Column(inner =>
                {
                    inner.Item()
                        .Text("ALICI")
                        .FontSize(9)
                        .FontColor(Colors.Grey.Darken2)
                        .Bold();
                    inner.Item().Text(invoice.CustomerFullName).Bold();
                    inner.Item()
                        .Text(invoice.CustomerEmail)
                        .FontColor(Colors.Grey.Darken1);
                    inner.Item()
                        .Text(invoice.CustomerAddress)
                        .FontColor(Colors.Grey.Darken1);
                });

            // Ürün tablosu — QuestPDF 2026 Table API
            col.Item().PaddingTop(24).Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn(4);
                    c.RelativeColumn(1);
                    c.RelativeColumn(1.5f);
                    c.RelativeColumn(1.5f);
                });

                // ── Header: action<TableCellDescriptor> handler şeklinde ──
                table.Header(header =>
                {
                    static void HeaderCell(TableCellDescriptor cell, string text) =>
                        cell.Background(Colors.Black)
                            .Padding(8)
                            .Text(text)
                            .FontColor(Colors.White)
                            .Bold()
                            .FontSize(9);

                    HeaderCell(header.Cell(), "ÜRÜN");
                    HeaderCell(header.Cell(), "ADET");
                    HeaderCell(header.Cell(), "BİRİM FİYAT");
                    HeaderCell(header.Cell(), "TOPLAM");
                });

                // ── Satırlar ─────────────────────────────────────────────
                foreach (var item in items)
                {
                    static IContainer BodyCell(TableDescriptor t) =>
                        t.Cell()
                            .BorderBottom(1)
                            .BorderColor(Colors.Grey.Lighten3)
                            .Padding(8);

                    BodyCell(table).Text(item.ProductName);
                    BodyCell(table).AlignRight().Text(item.Quantity.ToString());
                    BodyCell(table).AlignRight().Text($"₺{item.UnitPrice:F2}");
                    BodyCell(table).AlignRight().Text($"₺{item.LineTotal:F2}");
                }
            });

            // Tutar özeti
            col.Item()
                .PaddingTop(16)
                .AlignRight()
                .Width(240)
                .Column(summary =>
                {
                    AddSummaryRow(summary, "Ara Toplam", $"₺{invoice.SubTotal:F2}");

                    if (invoice.ShippingAmount > 0)
                        AddSummaryRow(summary, "Kargo", $"₺{invoice.ShippingAmount:F2}");

                    AddSummaryRow(
                        summary,
                        $"KDV (%{invoice.VatRate * 100:F0})",
                        $"₺{invoice.VatAmount:F2}"
                    );

                    summary.Item()
                        .Background(Colors.Black)
                        .Padding(8)
                        .Row(r =>
                        {
                            r.RelativeItem()
                                .Text("GENEL TOPLAM")
                                .FontColor(Colors.White)
                                .Bold();
                            r.AutoItem()
                                .Text($"₺{invoice.TotalAmount:F2}")
                                .FontColor(Colors.White)
                                .Bold();
                        });
                });
        });
    }

    private static void AddSummaryRow(ColumnDescriptor col, string label, string value) =>
        col.Item()
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten2)
            .Padding(6)
            .Row(r =>
            {
                r.RelativeItem().Text(label).FontColor(Colors.Grey.Darken2);
                r.AutoItem().Text(value);
            });

    // ── Bölüm: Footer ────────────────────────────────────────────────────────

    private static void ComposeFooter(IContainer container, Invoice invoice)
    {
        container
            .BorderTop(1)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingTop(8)
            .Row(row =>
            {
                row.RelativeItem()
                    .Text("Bu fatura otomatik olarak oluşturulmuştur.")
                    .FontSize(8)
                    .FontColor(Colors.Grey.Medium);
                row.AutoItem()
                    .Text($"Sipariş ID: {invoice.OrderId}")
                    .FontSize(8)
                    .FontColor(Colors.Grey.Medium);
            });
    }

    // ── Yardımcı metotlar ────────────────────────────────────────────────────

    private async Task<string> GenerateInvoiceNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.Invoices.CountAsync(i => i.IssuedAt.Year == year);
        return $"INV-{year}-{(count + 1):D6}";
    }

    private async Task<string> UploadToCloudinaryAsync(byte[] pdfBytes, string invoiceNumber)
    {
        var cloudName = _config["Cloudinary:CloudName"];
        var apiKey = _config["Cloudinary:ApiKey"];
        var apiSecret = _config["Cloudinary:ApiSecret"];

        if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Cloudinary config eksik — PDF yerel path döndürülüyor.");
            return $"/invoices/{invoiceNumber}.pdf";
        }

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/raw/upload";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var publicId = $"invoices/{invoiceNumber}";

        var signatureString = $"public_id={publicId}&timestamp={timestamp}{apiSecret}";
        var signature = ComputeSha1(signatureString);

        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(pdfBytes), "file", $"{invoiceNumber}.pdf");
        content.Add(new StringContent(apiKey), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(publicId), "public_id");
        content.Add(new StringContent(signature), "signature");
        content.Add(new StringContent("raw"), "resource_type");

        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        var response = await http.PostAsync(uploadUrl, content);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Cloudinary yükleme başarısız: {Status}", response.StatusCode);
            return $"/invoices/{invoiceNumber}.pdf";
        }

        var json = System.Text.Json.JsonDocument.Parse(
            await response.Content.ReadAsStringAsync()
        );
        return json.RootElement.GetProperty("secure_url").GetString()
            ?? $"/invoices/{invoiceNumber}.pdf";
    }

    private static string ComputeSha1(string input)
    {
        var bytes = System.Security.Cryptography.SHA1.HashData(
            System.Text.Encoding.UTF8.GetBytes(input)
        );
        return Convert.ToHexString(bytes).ToLower();
    }

    private static string BuildInvoiceEmailBody(Invoice invoice) =>
        $"""
         Merhaba {invoice.CustomerFullName},

         {invoice.InvoiceNumber} numaralı faturanız hazırlanmıştır.

         Sipariş Tutarı : ₺{invoice.SubTotal:F2}
         KDV ({invoice.VatRate * 100:F0}%)    : ₺{invoice.VatAmount:F2}
         Kargo          : ₺{invoice.ShippingAmount:F2}
         Genel Toplam   : ₺{invoice.TotalAmount:F2}

         Faturanızı aşağıdaki linkten indirebilirsiniz:
         {invoice.PdfUrl}

         İyi alışverişler,
         {invoice.MerchantStoreName}
         """;
}
