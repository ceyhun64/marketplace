"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type OrderStatus =
  | "Pending"
  | "PaymentConfirmed"
  | "LabelGenerated"
  | "CourierAssigned"
  | "PickedUp"
  | "InTransit"
  | "OutForDelivery"
  | "Delivered"
  | "Failed"
  | "Cancelled";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
interface Order {
  id: string;
  status: OrderStatus;
  source: "Marketplace" | "Estore";
  totalAmount: number;
  shippingRate: "Express" | "Regular";
  createdAt: string;
  items: OrderItem[];
  trackingNumber?: string;
}

const STATUS_META: Record<OrderStatus, { label: string; step: number }> = {
  Pending: { label: "Pending", step: 0 },
  PaymentConfirmed: { label: "Payment Confirmed", step: 1 },
  LabelGenerated: { label: "Label Generated", step: 2 },
  CourierAssigned: { label: "Courier Assigned", step: 3 },
  PickedUp: { label: "Picked Up", step: 4 },
  InTransit: { label: "In Transit", step: 5 },
  OutForDelivery: { label: "Out for Delivery", step: 6 },
  Delivered: { label: "Delivered", step: 7 },
  Failed: { label: "Failed", step: -1 },
  Cancelled: { label: "Cancelled", step: -1 },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled / Failed" },
];

function statusMatch(status: OrderStatus, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "active")
    return !["Delivered", "Failed", "Cancelled"].includes(status);
  if (filter === "Cancelled")
    return status === "Cancelled" || status === "Failed";
  return status === filter;
}

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "PaymentConfirmed",
  LABEL_GENERATED: "LabelGenerated",
  COURIER_ASSIGNED: "CourierAssigned",
  PICKED_UP: "PickedUp",
  IN_TRANSIT: "InTransit",
  OUT_FOR_DELIVERY: "OutForDelivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

function normalizeOrder(raw: Order): Order {
  return {
    ...raw,
    status: ORDER_STATUS_MAP[raw.status as string] ?? raw.status,
    source:
      (raw.source as string) === "MARKETPLACE"
        ? "Marketplace"
        : (raw.source as string) === "ESTORE"
          ? "Estore"
          : raw.source,
    shippingRate:
      (raw.shippingRate as string) === "EXPRESS"
        ? "Express"
        : (raw.shippingRate as string) === "REGULAR"
          ? "Regular"
          : raw.shippingRate,
  };
}

function statusColor(status: OrderStatus): { text: string; bg: string } {
  if (status === "Delivered")
    return { text: "var(--red)", bg: "rgba(200,16,46,0.08)" };
  if (status === "Failed" || status === "Cancelled")
    return { text: "var(--charcoal-soft)", bg: "rgba(51,51,51,0.08)" };
  return { text: "var(--charcoal)", bg: "rgba(51,51,51,0.06)" };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Order[]>("/api/orders")
      .then((r) => setOrders((r.data as Order[]).map(normalizeOrder)))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => statusMatch(o.status, filter));

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(51,51,51,0.08)",
          background: "#fff",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red)" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--charcoal-soft)" }}
            >
              My Account
            </span>
          </div>
          <h1
            className="font-normal text-[var(--charcoal)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.2rem",
            }}
          >
            My <em style={{ color: "var(--red)" }}>Orders</em>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: filter === tab.key ? "var(--charcoal)" : "#fff",
                color: filter === tab.key ? "#fff" : "var(--charcoal-soft)",
                border:
                  filter === tab.key
                    ? "1.5px solid var(--charcoal)"
                    : "1.5px solid rgba(51,51,51,0.12)",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl animate-pulse"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(51,51,51,0.08)",
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📦</div>
            <p
              style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
            >
              No orders found in this category.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm font-semibold"
              style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const meta = STATUS_META[order.status];
              const sc = statusColor(order.status);
              const isExpanded = expandedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(51,51,51,0.08)",
                    boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                  }}
                >
                  {/* Red accent top */}
                  {order.status === "Delivered" && (
                    <div
                      className="h-[3px]"
                      style={{ background: "var(--red)" }}
                    />
                  )}

                  <button
                    className="w-full text-left p-5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--off-white)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full"
                            style={{
                              color: sc.text,
                              background: sc.bg,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {meta.label}
                          </span>
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "var(--charcoal-soft)" }}
                          >
                            {order.source === "Marketplace"
                              ? "Marketplace"
                              : "E-Store"}
                          </span>
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "var(--charcoal-soft)" }}
                          >
                            ·
                          </span>
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "var(--charcoal-soft)" }}
                          >
                            {order.shippingRate === "Express"
                              ? "⚡ Express"
                              : "📦 Standard"}
                          </span>
                        </div>
                        <p
                          className="text-[0.875rem] mb-1 truncate"
                          style={{
                            color: "var(--charcoal)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {order.items
                            .slice(0, 2)
                            .map((i) => `${i.productName} ×${i.quantity}`)
                            .join(", ")}
                          {order.items.length > 2 &&
                            ` +${order.items.length - 2} more`}
                        </p>
                        <p
                          className="font-mono text-[11px]"
                          style={{ color: "var(--charcoal-soft)" }}
                        >
                          #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="font-bold text-[var(--charcoal)]"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.25rem",
                          }}
                        >
                          ₺{order.totalAmount.toLocaleString("tr-TR")}
                        </p>
                        <p
                          className="font-mono text-[11px] mt-1"
                          style={{ color: "var(--red)" }}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      className="px-5 py-4 space-y-4"
                      style={{
                        borderTop: "1px solid rgba(51,51,51,0.06)",
                        background: "var(--off-white)",
                      }}
                    >
                      <div>
                        <p
                          className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3"
                          style={{ color: "var(--charcoal-soft)" }}
                        >
                          Products
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-[0.875rem]"
                            >
                              <span
                                style={{
                                  color: "var(--charcoal-mid)",
                                  fontFamily: "var(--font-body)",
                                }}
                              >
                                {item.productName}{" "}
                                <span style={{ color: "var(--charcoal-soft)" }}>
                                  ×{item.quantity}
                                </span>
                              </span>
                              <span
                                className="font-bold"
                                style={{
                                  color: "var(--charcoal)",
                                  fontFamily: "var(--font-display)",
                                }}
                              >
                                ₺
                                {(
                                  item.unitPrice * item.quantity
                                ).toLocaleString("tr-TR")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        {order.trackingNumber && (
                          <Link
                            href={`/orders/${order.id}/tracking`}
                            className="flex-1 text-center py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
                            style={{
                              background: "var(--charcoal)",
                              fontFamily: "var(--font-body)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "var(--red)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "var(--charcoal)")
                            }
                          >
                            Track Order →
                          </Link>
                        )}
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-colors"
                          style={{
                            border: "1.5px solid rgba(51,51,51,0.15)",
                            color: "var(--charcoal)",
                            fontFamily: "var(--font-body)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = "var(--red)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor =
                              "rgba(51,51,51,0.15)")
                          }
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
