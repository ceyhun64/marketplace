"use client";

import { useState, Fragment } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatShortDate } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_SOURCE_LABELS,
} from "@/types/enums";
import { usePackOrder } from "@/queries/useOrders";
import type { Order } from "@/types/entities";
import { ChevronDown, ChevronRight, Package } from "lucide-react";

interface Props {
  orders: Order[];
  loading?: boolean;
}

const HEADERS = ["Order No.", "Customer", "Amount", "Status", "Channel", "Date", "Action"];

// -- Skeleton ------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="overflow-hidden">
      {/* Desktop skeleton */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wide whitespace-nowrap">
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
      {/* Mobile skeleton */}
      <div className="sm:hidden divide-y divide-(--border-subtle)">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2.5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export default function MerchantOrdersTable({ orders, loading }: Props) {
  const packMutation = usePackOrder();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return <TableSkeleton />;

  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-(--text-tertiary)">
        <Package size={28} className="mb-2 opacity-30" />
        <p className="text-sm font-medium">No orders yet</p>
        <p className="text-xs mt-1">Orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* -- Desktop table — hidden below sm ----------------------------------- */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-subtle)">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const canPack = order.status === "PENDING" || order.status === "PAYMENT_CONFIRMED";

              return (
                <Fragment key={order.id}>
                  <tr
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    className="hover:bg-(--bg-sunken) transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-(--info) focus-visible:-outline-offset-2"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : order.id);
                      }
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {isExpanded
                          ? <ChevronDown className="w-3 h-3 text-(--text-tertiary)" />
                          : <ChevronRight className="w-3 h-3 text-(--text-tertiary)" />}
                        <span className="font-mono text-xs text-(--info) font-semibold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-(--text-secondary)">{order.customerName ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-(--text-primary)">{formatPrice(order.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        order.source === "MARKETPLACE"
                          ? "bg-(--info-bg) text-(--info)"
                          : "bg-(--off-white-2) text-(--charcoal-mid)"
                      }`}>
                        {ORDER_SOURCE_LABELS[order.source]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-(--text-tertiary) whitespace-nowrap">
                      {formatShortDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      {canPack ? (
                        <button
                          onClick={() => packMutation.mutate(order.id)}
                          disabled={packMutation.isPending}
                          className="text-xs bg-(--success) text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
                        >
                          {packMutation.isPending ? "..." : "Mark Packed"}
                        </button>
                      ) : (
                        <span className="text-xs text-(--text-tertiary)">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {isExpanded && (
                    <tr className="bg-(--bg-sunken)/80">
                      <td colSpan={7} className="px-5 py-4">
                        <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-2">
                          Order Items
                        </p>
                        <div className="space-y-1.5">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-(--bg-surface) rounded-lg px-4 py-2.5 border border-(--border-light)"
                            >
                              <span className="font-medium text-(--text-primary) text-sm">{item.productName}</span>
                              <div className="flex items-center gap-4 text-(--text-secondary) text-sm">
                                <span>{item.quantity} pcs</span>
                                <span className="font-semibold text-(--text-primary)">{formatPrice(item.lineTotal)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-(--border-mid) text-sm">
                          <span className="text-(--text-secondary)">
                            Shipping: <strong className="text-(--text-primary)">{order.shippingRate === "EXPRESS" ? "Express" : "Standard"}</strong>
                          </span>
                          <span className="font-semibold text-(--text-primary)">Total: {formatPrice(order.totalAmount)}</span>
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

      {/* -- Mobile cards — hidden above sm ------------------------------------ */}
      <div className="sm:hidden divide-y divide-(--border-subtle)">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const canPack = order.status === "PENDING" || order.status === "PAYMENT_CONFIRMED";

          return (
            <div key={order.id} className="p-4 space-y-3">
              {/* Row 1: Order ID + status */}
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-1.5">
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-(--text-tertiary)" />
                    : <ChevronRight className="w-3.5 h-3.5 text-(--text-tertiary)" />}
                  <span className="font-mono text-sm font-bold text-(--info)">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </button>

              {/* Row 2: Customer + amount + channel */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--text-primary)">{order.customerName ?? "—"}</p>
                  <p className="text-xs text-(--text-tertiary) mt-0.5">{formatShortDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-(--text-primary)">{formatPrice(order.totalAmount)}</p>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                    order.source === "MARKETPLACE"
                      ? "bg-(--info-bg) text-(--info)"
                      : "bg-(--off-white-2) text-(--charcoal-mid)"
                  }`}>
                    {ORDER_SOURCE_LABELS[order.source]}
                  </span>
                </div>
              </div>

              {/* Pack button */}
              {canPack && (
                <button
                  onClick={() => packMutation.mutate(order.id)}
                  disabled={packMutation.isPending}
                  className="w-full text-sm font-semibold bg-(--success) text-white rounded-xl py-2.5 min-h-11 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {packMutation.isPending ? "Packing..." : "Mark Packed"}
                </button>
              )}

              {/* Expanded items (accordion) */}
              {isExpanded && (
                <div className="rounded-xl bg-(--bg-sunken) border border-(--border-light) p-3 space-y-2">
                  <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">
                    Order Items
                  </p>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-(--bg-surface) rounded-lg px-3 py-2.5 border border-(--border-light)"
                    >
                      <span className="text-sm text-(--text-primary) font-medium">{item.productName}</span>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <span className="text-(--text-secondary)">{item.quantity}×</span>
                        <span className="font-semibold text-(--text-primary)">{formatPrice(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-(--border-mid) text-sm">
                    <span className="text-(--text-secondary)">
                      {order.shippingRate === "EXPRESS" ? "Express" : "Standard"}
                    </span>
                    <span className="font-bold text-(--text-primary)">Total: {formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
