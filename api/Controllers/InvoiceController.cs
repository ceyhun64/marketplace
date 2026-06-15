using api.Common.DTOs;
using api.Domain.Entities;
using api.Infrastructure.Persistence;
using api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController(
    AppDbContext db,
    ICurrentUserService currentUser,
    IInvoiceGeneratorService invoiceGenerator,
    ILogger<InvoicesController> logger
) : ControllerBase
{
    // ── GET /api/invoices — Merchant: kendi faturalarını listele ──────────────

    [HttpGet]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMyInvoices()
    {
        var userId = currentUser.UserId;
        var merchant = await db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
        if (merchant == null)
            return NotFound(new ApiResponse<string>("Merchant profili bulunamadı."));

        var invoices = await db
            .Invoices.Include(i => i.Order)
            .Where(i => i.MerchantId == merchant.Id)
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new InvoiceSummaryDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                OrderId = i.OrderId,
                OrderNumber =
                    i.Order != null
                        ? i.Order.Id.ToString().Substring(0, 8).ToUpper()
                        : string.Empty,
                MerchantStoreName = i.MerchantStoreName,
                CustomerName = i.CustomerFullName,
                SubTotal = i.SubTotal,
                VatRate = i.VatRate,
                VatAmount = i.VatAmount,
                TotalAmount = i.TotalAmount,
                PdfUrl = i.PdfUrl,
                IssuedAt = i.IssuedAt,
                Source = i.Order != null ? i.Order.Source.ToString().ToUpper() : string.Empty,
            })
            .ToListAsync();

        return Ok(new ApiResponse<List<InvoiceSummaryDto>>(invoices));
    }

    // ── GET /api/invoices/admin/all — Admin: tüm faturalar ───────────────────

    [HttpGet("admin/all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAllInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] Guid? merchantId = null
    )
    {
        var query = db.Invoices.AsQueryable();

        if (merchantId.HasValue)
            query = query.Where(i => i.MerchantId == merchantId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(i => i.Order)
            .OrderByDescending(i => i.IssuedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(i => new InvoiceSummaryDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                OrderId = i.OrderId,
                OrderNumber =
                    i.Order != null
                        ? i.Order.Id.ToString().Substring(0, 8).ToUpper()
                        : string.Empty,
                MerchantStoreName = i.MerchantStoreName,
                CustomerName = i.CustomerFullName,
                SubTotal = i.SubTotal,
                VatRate = i.VatRate,
                VatAmount = i.VatAmount,
                TotalAmount = i.TotalAmount,
                PdfUrl = i.PdfUrl,
                IssuedAt = i.IssuedAt,
                Source = i.Order != null ? i.Order.Source.ToString().ToUpper() : string.Empty,
            })
            .ToListAsync();

        return Ok(
            new ApiResponse<object>(
                new
                {
                    items,
                    totalCount,
                    page,
                    limit,
                }
            )
        );
    }

    // ── GET /api/invoices/{id} — Detay (merchant, admin, müşteri) ────────────

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var invoice = await db
            .Invoices.Include(i => i.Order)
                .ThenInclude(o => o.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return NotFound(new ApiResponse<string>("Fatura bulunamadı."));

        // Yetki kontrolü: Admin her faturayı görebilir, Merchant sadece kendi faturasını
        var role = currentUser.Role;
        var userId = currentUser.UserId;

        if (role == "Merchant")
        {
            var merchant = await db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
            if (merchant == null || invoice.MerchantId != merchant.Id)
                return Forbid();
        }
        else if (role == "Customer")
        {
            if (invoice.CustomerId != userId)
                return Forbid();
        }
        // Admin: erişim serbest

        var dto = MapToDto(invoice);
        return Ok(new ApiResponse<InvoiceDto>(dto));
    }

    // ── GET /api/invoices/{id}/download — PDF indir ───────────────────────────

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var invoice = await db
            .Invoices.Include(i => i.Order)
                .ThenInclude(o => o.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return NotFound(new ApiResponse<string>("Fatura bulunamadı."));

        // Yetki kontrolü
        var role = currentUser.Role;
        var userId = currentUser.UserId;

        if (role == "Merchant")
        {
            var merchant = await db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
            if (merchant == null || invoice.MerchantId != merchant.Id)
                return Forbid();
        }
        else if (role == "Customer")
        {
            if (invoice.CustomerId != userId)
                return Forbid();
        }

        // PDF URL zaten varsa redirect et (Cloudinary CDN)
        if (!string.IsNullOrEmpty(invoice.PdfUrl))
            return Redirect(invoice.PdfUrl);

        // PDF yoksa üret
        try
        {
            var pdfBytes = await invoiceGenerator.GeneratePdfBytesAsync(invoice);
            return File(pdfBytes, "application/pdf", $"fatura-{invoice.InvoiceNumber}.pdf");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fatura PDF üretme hatası: {InvoiceId}", id);
            return StatusCode(500, new ApiResponse<string>("PDF üretilemedi."));
        }
    }

    // ── GET /api/invoices/accounting — Admin: tüm muhasebe kayıtları ──────────
    /// <summary>
    /// Muhasebe kayıtlarını (AccountingEntry) listeler.
    /// Admin tüm kayıtları görebilir; merchantId ile filtrele.
    /// Milestone 3: "Muhasebe kayıtları: sipariş/fatura/ödeme bağlantılı tam iz"
    /// </summary>
    [HttpGet("accounting")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAccountingEntries(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] Guid? merchantId = null,
        [FromQuery] string? entryType = null
    )
    {
        var query = db.AccountingEntries
            .Include(e => e.Invoice)
            .Include(e => e.Merchant)
            .AsQueryable();

        if (merchantId.HasValue)
            query = query.Where(e => e.MerchantId == merchantId.Value);

        if (!string.IsNullOrEmpty(entryType))
            query = query.Where(e => e.EntryType == entryType.ToUpper());

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(e => new AccountingEntryDto
            {
                Id = e.Id,
                InvoiceNumber = e.Invoice.InvoiceNumber,
                MerchantStoreName = e.Merchant.StoreName,
                EntryType = e.EntryType,
                Amount = e.Amount,
                Description = e.Description,
                PaymentReference = e.PaymentReference,
                CreatedAt = e.CreatedAt,
            })
            .ToListAsync();

        return Ok(new ApiResponse<object>(new { items, totalCount, page, limit }));
    }

    // ── GET /api/invoices/accounting/merchant — Merchant: kendi muhasebe kayıtları
    /// <summary>
    /// Merchant kendi muhasebe izini görür (sipariş/fatura/ödeme tam iz).
    /// </summary>
    [HttpGet("accounting/merchant")]
    [Authorize(Policy = "MerchantOnly")]
    public async Task<IActionResult> GetMyAccountingEntries(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? entryType = null
    )
    {
        var userId = currentUser.UserId;
        var merchant = await db.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
        if (merchant == null)
            return NotFound(new ApiResponse<string>("Merchant profili bulunamadı."));

        var query = db.AccountingEntries
            .Include(e => e.Invoice)
            .Where(e => e.MerchantId == merchant.Id)
            .AsQueryable();

        if (!string.IsNullOrEmpty(entryType))
            query = query.Where(e => e.EntryType == entryType.ToUpper());

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(e => new AccountingEntryDto
            {
                Id = e.Id,
                InvoiceNumber = e.Invoice.InvoiceNumber,
                MerchantStoreName = merchant.StoreName,
                EntryType = e.EntryType,
                Amount = e.Amount,
                Description = e.Description,
                PaymentReference = e.PaymentReference,
                CreatedAt = e.CreatedAt,
            })
            .ToListAsync();

        return Ok(new ApiResponse<object>(new { items, totalCount, page, limit }));
    }

    // ── POST /api/invoices/generate/{orderId} — Admin: Sipariş için fatura üret

    [HttpPost("generate/{orderId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GenerateForOrder(Guid orderId)
    {
        var order = await db
            .Orders.Include(o => o.Items)
            .Include(o => o.Customer)
            .Include(o => o.Invoices)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            return NotFound(new ApiResponse<string>("Sipariş bulunamadı."));

        var vendorOrderCount = await db.VendorOrders.CountAsync(vo => vo.OrderId == orderId);
        if (vendorOrderCount > 0 && order.Invoices.Count >= vendorOrderCount)
            return Conflict(new ApiResponse<string>("Bu sipariş için fatura(lar) zaten mevcut."));

        try
        {
            var invoices = await invoiceGenerator.GenerateAndSaveAsync(order);
            var orderNumber = order.Id.ToString().Substring(0, 8).ToUpper();
            var source = order.Source.ToString().ToUpper();

            return Ok(
                new ApiResponse<List<InvoiceSummaryDto>>(
                    invoices
                        .Select(invoice => new InvoiceSummaryDto
                        {
                            Id = invoice.Id,
                            InvoiceNumber = invoice.InvoiceNumber,
                            OrderId = invoice.OrderId,
                            OrderNumber = orderNumber,
                            MerchantStoreName = invoice.MerchantStoreName,
                            CustomerName = invoice.CustomerFullName,
                            SubTotal = invoice.SubTotal,
                            VatRate = invoice.VatRate,
                            VatAmount = invoice.VatAmount,
                            TotalAmount = invoice.TotalAmount,
                            PdfUrl = invoice.PdfUrl,
                            IssuedAt = invoice.IssuedAt,
                            Source = source,
                        })
                        .ToList()
                )
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fatura oluşturma hatası: {OrderId}", orderId);
            return StatusCode(500, new ApiResponse<string>("Fatura oluşturulamadı."));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static InvoiceDto MapToDto(Invoice i) =>
        new()
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            OrderId = i.OrderId,
            MerchantId = i.MerchantId,
            MerchantStoreName = i.MerchantStoreName,
            CustomerFullName = i.CustomerFullName,
            CustomerEmail = i.CustomerEmail,
            SubTotal = i.SubTotal,
            VatRate = i.VatRate,
            VatAmount = i.VatAmount,
            ShippingAmount = i.ShippingAmount,
            TotalAmount = i.TotalAmount,
            PdfUrl = i.PdfUrl,
            IsSent = i.IsSent,
            IssuedAt = i.IssuedAt,
            LineItems =
                (
                    i.VendorOrderId.HasValue
                        ? i.Order?.Items.Where(item => item.VendorOrderId == i.VendorOrderId)
                        : i.Order?.Items
                )
                    ?.Select(item => new InvoiceLineItemDto
                    {
                        ProductName = item.ProductName,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        LineTotal = item.LineTotal,
                    })
                    .ToList()
                ?? [],
        };
}
