"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useMyInvoices, useDownloadInvoice } from "@/queries/useSubscription";
import { formatPrice, formatDate } from "@/lib/format";

export default function InvoicesTable() {
  const { data, isLoading } = useMyInvoices({ limit: 20 });
  const downloadMutation = useDownloadInvoice();

  const invoices = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {[
                "Invoice No.",
                "Order",
                "Subtotal",
                "VAT",
                "Total",
                "Date",
                "PDF",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-subtle)">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-5 py-3">
                    <Skeleton className="h-4 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!invoices.length) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl p-12 text-center text-(--text-tertiary)">
        <p className="text-sm font-medium">No invoices yet</p>
        <p className="text-xs mt-1">
          Invoices will appear here as sales are made.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
          <tr>
            {[
              "Invoice No.",
              "Order",
              "Subtotal",
              "VAT",
              "Total",
              "Date",
              "PDF",
            ].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border-subtle)">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-(--bg-sunken) transition-colors">
              <td className="px-5 py-3">
                <span className="font-mono text-xs font-bold text-(--info)">
                  {inv.invoiceNumber}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className="font-mono text-xs text-(--text-secondary)">
                  #{inv.orderId.slice(0, 8).toUpperCase()}
                </span>
              </td>
              <td className="px-5 py-3 text-(--text-primary)">
                {formatPrice(inv.subTotal)}
              </td>
              <td className="px-5 py-3 text-(--text-secondary)">
                {formatPrice(inv.vatAmount)}
              </td>
              <td className="px-5 py-3 font-semibold text-(--text-primary)">
                {formatPrice(inv.totalAmount)}
              </td>
              <td className="px-5 py-3 text-xs text-(--text-tertiary)">
                {formatDate(inv.issuedAt)}
              </td>
              <td className="px-5 py-3">
                {inv.pdfUrl ? (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-(--success) hover:underline font-medium"
                  >
                    Download
                  </a>
                ) : (
                  <button
                    onClick={() => downloadMutation.mutate(inv.id)}
                    disabled={downloadMutation.isPending}
                    className="text-xs text-(--info) hover:underline disabled:opacity-50"
                  >
                    {downloadMutation.isPending ? "..." : "Download"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
