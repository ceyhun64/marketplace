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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Fatura No",
                "Sipariş",
                "Tutar",
                "KDV",
                "Toplam",
                "Tarih",
                "İndir",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs text-[#7A7060] uppercase tracking-wide font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
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
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">🧾</div>
        <p className="text-sm font-medium text-gray-700">Henüz fatura yok</p>
        <p className="text-xs text-[#7A7060] mt-1">
          Satışlar gerçekleştikçe faturalar burada listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-[#7A7060] uppercase tracking-wide">
          <tr>
            {[
              "Fatura No",
              "Sipariş",
              "Ara Toplam",
              "KDV",
              "Toplam",
              "Tarih",
              "PDF",
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="hover:bg-[#F5F2EB]/40 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-bold text-[#1A4A6B]">
                  {inv.invoiceNumber}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-[#7A7060]">
                  #{inv.orderId.slice(0, 8).toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 font-serif text-[#0D0D0D]">
                {formatPrice(inv.subTotal)}
              </td>
              <td className="px-4 py-3 text-[#7A7060]">
                {formatPrice(inv.vatAmount)}
              </td>
              <td className="px-4 py-3 font-serif font-semibold text-[#0D0D0D]">
                {formatPrice(inv.totalAmount)}
              </td>
              <td className="px-4 py-3 text-xs text-[#7A7060]">
                {formatDate(inv.issuedAt)}
              </td>
              <td className="px-4 py-3">
                {inv.pdfUrl ? (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2D7A4F] hover:underline font-medium"
                  >
                    📄 İndir
                  </a>
                ) : (
                  <button
                    onClick={() => downloadMutation.mutate(inv.id)}
                    disabled={downloadMutation.isPending}
                    className="text-xs text-[#1A4A6B] hover:underline disabled:opacity-50"
                  >
                    {downloadMutation.isPending ? "..." : "📄 İndir"}
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
