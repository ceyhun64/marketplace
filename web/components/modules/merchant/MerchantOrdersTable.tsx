"use client";

import { useState, Fragment } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime, formatShortDate } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_SOURCE_LABELS,
} from "@/types/enums";
import { usePackOrder } from "@/queries/useOrders";
import type { Order } from "@/types/entities";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  orders: Order[];
  loading?: boolean;
}

export default function MerchantOrdersTable({ orders, loading }: Props) {
  const packMutation = usePackOrder();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken)] border-b border-(--border-light)]">
            <tr>
              {[
                "Order No.",
                "Customer",
                "Amount",
                "Status",
                "Channel",
                "Date",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary)] uppercase tracking-wide"
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
      <div className="flex flex-col items-center justify-center py-16 text-(--text-tertiary)]">
        <p className="text-sm font-medium">No orders yet</p>
        <p className="text-xs mt-1">Orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-(--bg-sunken)] border-b border-(--border-light)]">
          <tr>
            {[
              "Order No.",
              "Customer",
              "Amount",
              "Status",
              "Channel",
              "Date",
              "Action",
            ].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary)] uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border-subtle)">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const canPack = order.status === "PAYMENT_CONFIRMED";

            return (
              <Fragment key={order.id}>
                <tr
                  className="hover:bg-(--bg-sunken)] transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-(--text-tertiary)]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-(--text-tertiary)]" />
                      )}
                      <span className="font-mono text-xs text-(--info)] font-semibold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-(--text-secondary)]">
                    {order.customerName ?? "—"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-(--text-primary)]">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        order.source === "MARKETPLACE"
                          ? "bg-(--info-bg)] text-(--info)]"
                          : "bg-(--off-white-2)] text-(--charcoal-mid)]"
                      }`}
                    >
                      {ORDER_SOURCE_LABELS[order.source]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-(--text-tertiary)]">
                    {formatShortDate(order.createdAt)}
                  </td>
                  <td
                    className="px-5 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canPack ? (
                      <button
                        onClick={() => packMutation.mutate(order.id)}
                        disabled={packMutation.isPending}
                        className="text-xs bg-(--success)] text-white px-3 py-1.5 rounded-lg hover:bg-(--success)] disabled:opacity-50 transition-colors font-medium"
                      >
                        {packMutation.isPending ? "..." : "Mark Packed"}
                      </button>
                    ) : (
                      <span className="text-xs text-(--text-tertiary)]">—</span>
                    )}
                  </td>
                </tr>

                {/* Expanded: order items */}
                {isExpanded && (
                  <tr className="bg-(--bg-sunken)]/80">
                    <td colSpan={7} className="px-5 py-4">
                      <p className="text-xs font-semibold text-(--text-tertiary)] uppercase tracking-wider mb-2">
                        Order Items
                      </p>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-(--bg-surface)] rounded-lg px-4 py-2.5 border border-(--border-light)]"
                          >
                            <span className="font-medium text-(--text-primary)] text-sm">
                              {item.productName}
                            </span>
                            <div className="flex items-center gap-4 text-(--text-secondary)] text-sm">
                              <span>{item.quantity} pcs</span>
                              <span className="font-semibold text-(--text-primary)]">
                                {formatPrice(item.lineTotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-(--border-mid)] text-sm">
                        <span className="text-(--text-secondary)]">
                          Shipping:{" "}
                          <strong className="text-(--text-primary)]">
                            {order.shippingRate === "EXPRESS"
                              ? "Express"
                              : "Standard"}
                          </strong>
                        </span>
                        <span className="font-semibold text-(--text-primary)]">
                          Total: {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
