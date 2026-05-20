using System.Text;
using api.Domain.Enums;
using api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

/// <summary>
/// Admin-only commission reconciliation ledger.
/// Aggregates VendorOrder.PlatformFee per merchant per period and exports as CSV or JSON.
/// </summary>
[ApiController]
[Route("api/admin/reconciliation")]
[Authorize(Policy = "AdminOnly")]
public class ReconciliationController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReconciliationController(AppDbContext db) => _db = db;

    /// <summary>
    /// GET /api/admin/reconciliation?from=2025-01-01&amp;to=2025-01-31&amp;format=csv
    /// Returns commission totals per merchant for the requested period.
    /// format: "json" (default) | "csv"
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetReconciliation(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] string format = "json"
    )
    {
        if (from >= to)
            return BadRequest(new { message = "from tarihi to tarihinden önce olmalıdır." });

        var toExclusive = to.Date.AddDays(1); // inclusive end date

        var rows = await _db
            .VendorOrders.Where(vo =>
                vo.Status != OrderStatus.Cancelled
                && vo.CreatedAt >= from.Date
                && vo.CreatedAt < toExclusive
            )
            .GroupBy(vo => new { vo.MerchantId, StoreName = vo.Merchant.StoreName })
            .Select(g => new ReconciliationRowDto
            {
                MerchantId = g.Key.MerchantId,
                StoreName = g.Key.StoreName,
                OrderCount = g.Count(),
                GrossRevenue = g.Sum(vo => vo.SubTotal),
                PlatformFee = g.Sum(vo => vo.PlatformFee),
                MerchantNet = g.Sum(vo => vo.MerchantNetAmount),
                SettledCount = g.Count(vo => vo.SettledAt != null),
                UnSettledCount = g.Count(vo => vo.SettledAt == null),
            })
            .OrderByDescending(r => r.PlatformFee)
            .ToListAsync();

        var summary = new ReconciliationSummaryDto
        {
            From = from.Date,
            To = to.Date,
            TotalGrossRevenue = rows.Sum(r => r.GrossRevenue),
            TotalPlatformFee = rows.Sum(r => r.PlatformFee),
            TotalMerchantNet = rows.Sum(r => r.MerchantNet),
            MerchantCount = rows.Count,
            Rows = rows,
        };

        if (format.Equals("csv", StringComparison.OrdinalIgnoreCase))
            return CsvResult(summary);

        return Ok(summary);
    }

    private FileContentResult CsvResult(ReconciliationSummaryDto summary)
    {
        var sb = new StringBuilder();
        sb.AppendLine(
            "MerchantId,StoreName,OrderCount,GrossRevenue,PlatformFee,MerchantNet,SettledCount,UnSettledCount"
        );

        foreach (var r in summary.Rows)
        {
            sb.AppendLine(
                $"{r.MerchantId},"
                    + $"\"{r.StoreName.Replace("\"", "\"\"")}\","
                    + $"{r.OrderCount},"
                    + $"{r.GrossRevenue:F2},"
                    + $"{r.PlatformFee:F2},"
                    + $"{r.MerchantNet:F2},"
                    + $"{r.SettledCount},"
                    + $"{r.UnSettledCount}"
            );
        }

        // Summary footer
        sb.AppendLine();
        sb.AppendLine(
            $"TOTAL,,{summary.Rows.Sum(r => r.OrderCount)},{summary.TotalGrossRevenue:F2},{summary.TotalPlatformFee:F2},{summary.TotalMerchantNet:F2},,"
        );

        var fileName = $"reconciliation_{summary.From:yyyy-MM-dd}_{summary.To:yyyy-MM-dd}.csv";
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", fileName);
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public class ReconciliationSummaryDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public decimal TotalGrossRevenue { get; set; }
    public decimal TotalPlatformFee { get; set; }
    public decimal TotalMerchantNet { get; set; }
    public int MerchantCount { get; set; }
    public List<ReconciliationRowDto> Rows { get; set; } = new();
}

public class ReconciliationRowDto
{
    public Guid MerchantId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal GrossRevenue { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal MerchantNet { get; set; }
    public int SettledCount { get; set; }
    public int UnSettledCount { get; set; }
}
