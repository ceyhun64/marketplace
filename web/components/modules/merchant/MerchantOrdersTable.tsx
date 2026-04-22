"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime, formatShortDate } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_SOURCE_LABELS,
} from "@/types/enums";
import { usePackOrder } from "@/queries/useOrders";
import type { Order } from "@/types/entities";

interface Props {
  orders: Order[];
  loading?: boolean;
}

export default function MerchantOrdersTable({ orders, loading }: Props) {
  const packMutation = usePackOrder();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Sipariş No",
                "Müşteri",
                "Tutar",
                "Durum",
                "Kanal",
                "Tarih",
                "İşlem",
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
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">🛒</div>
        <p className="text-sm font-medium text-gray-700">Henüz sipariş yok</p>
        <p className="text-xs text-[#7A7060] mt-1">
          Siparişler burada listelenecek.
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
              "Sipariş No",
              "Müşteri",
              "Tutar",
              "Durum",
              "Kanal",
              "Tarih",
              "İşlem",
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const canPack = order.status === "PAYMENT_CONFIRMED";

            return (
              <>
                <tr
                  key={order.id}
                  className="hover:bg-[#F5F2EB]/40 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Sipariş No */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#1A4A6B] font-semibold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>

                  {/* Müşteri */}
                  <td className="px-4 py-3 text-[#0D0D0D]">
                    {order.customerName ?? "—"}
                  </td>

                  {/* Tutar */}
                  <td className="px-4 py-3 font-semibold font-serif text-[#0D0D0D]">
                    {formatPrice(order.totalAmount)}
                  </td>

                  {/* Durum */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>

                  {/* Kanal */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider font-medium ${
                        order.source === "MARKETPLACE"
                          ? "text-[#C84B2F]"
                          : "text-[#1A4A6B]"
                      }`}
                    >
                      {ORDER_SOURCE_LABELS[order.source]}
                    </span>
                  </td>

                  {/* Tarih */}
                  <td className="px-4 py-3 text-[#7A7060] text-xs">
                    {formatShortDate(order.createdAt)}
                  </td>

                  {/* İşlem */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canPack ? (
                      <button
                        onClick={() => packMutation.mutate(order.id)}
                        disabled={packMutation.isPending}
                        className="text-xs bg-[#2D7A4F] text-white px-3 py-1 rounded-lg hover:bg-[#2D7A4F]/80 disabled:opacity-50 transition-colors font-medium"
                      >
                        {packMutation.isPending ? "..." : "Hazırlandı"}
                      </button>
                    ) : (
                      <span className="text-xs text-[#7A7060]">—</span>
                    )}
                  </td>
                </tr>

                {/* Expanded: sipariş kalemleri */}
                {isExpanded && (
                  <tr key={`${order.id}-expanded`} className="bg-[#F5F2EB]/60">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="text-xs font-mono uppercase tracking-widest text-[#7A7060] mb-2">
                        Sipariş Kalemleri
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
                          >
                            <span className="font-medium text-[#0D0D0D]">
                              {item.productName}
                            </span>
                            <div className="flex items-center gap-4 text-[#7A7060]">
                              <span>{item.quantity} adet</span>
                              <span className="font-semibold text-[#0D0D0D] font-serif">
                                {formatPrice(item.lineTotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 text-sm">
                        <span className="text-[#7A7060]">
                          Kargo:{" "}
                          <strong className="text-[#0D0D0D]">
                            {order.shippingRate === "EXPRESS"
                              ? "Ekspres"
                              : "Standart"}
                          </strong>
                        </span>
                        <span className="font-semibold font-serif text-[#0D0D0D]">
                          Toplam: {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
