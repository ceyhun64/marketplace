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

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; step: number }
> = {
  Pending: { label: "Pending", color: "#92400e", bg: "#fef3c7", step: 0 },
  PaymentConfirmed: {
    label: "Payment Confirmed",
    color: "#1e40af",
    bg: "#dbeafe",
    step: 1,
  },
  LabelGenerated: {
    label: "Label Generated",
    color: "#5b21b6",
    bg: "#ede9fe",
    step: 2,
  },
  CourierAssigned: {
    label: "Courier Assigned",
    color: "#0e7490",
    bg: "#cffafe",
    step: 3,
  },
  PickedUp: {
    label: "Picked Up",
    color: "#0f766e",
    bg: "#ccfbf1",
    step: 4,
  },
  InTransit: { label: "In Transit", color: "#1d4ed8", bg: "#dbeafe", step: 5 },
  OutForDelivery: {
    label: "Out for Delivery",
    color: "#7c3aed",
    bg: "#f3e8ff",
    step: 6,
  },
  Delivered: {
    label: "Delivered",
    color: "#15803d",
    bg: "#dcfce7",
    step: 7,
  },
  Failed: { label: "Failed", color: "#b91c1c", bg: "#fee2e2", step: -1 },
  Cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6", step: -1 },
};

const FILTER_TABS: { key: string; label: string }[] = [
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

// ── Status normalizer (backend UPPER_SNAKE → component PascalCase) ────────────
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
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-mono">
            My Account
          </p>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
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
                className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-500">No orders found in this category.</p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-gray-900 underline underline-offset-2"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const meta = STATUS_META[order.status];
              const isExpanded = expandedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Main row */}
                  <button
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              color: meta.color,
                              background: meta.bg,
                            }}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {order.source === "Marketplace"
                              ? "Marketplace"
                              : "E-Store"}
                          </span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">
                            {order.shippingRate === "Express"
                              ? "⚡ Express"
                              : "📦 Standard"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate">
                          {order.items
                            .slice(0, 2)
                            .map((i) => `${i.productName} ×${i.quantity}`)
                            .join(", ")}
                          {order.items.length > 2 &&
                            ` +${order.items.length - 2} more items`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">
                          ₺{order.totalAmount.toLocaleString("tr-TR")}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {isExpanded ? "▲" : "▼"}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                      {/* Items */}
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-mono">
                          Ürünler
                        </p>
                        <div className="space-y-1.5">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-700">
                                {item.productName}{" "}
                                <span className="text-gray-400">
                                  ×{item.quantity}
                                </span>
                              </span>
                              <span className="text-gray-900 font-medium">
                                ₺
                                {(
                                  item.unitPrice * item.quantity
                                ).toLocaleString("tr-TR")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        {order.trackingNumber && (
                          <Link
                            href={`/orders/${order.id}/tracking`}
                            className="flex-1 text-center py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Kargo Takip →
                          </Link>
                        )}
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex-1 text-center py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:border-gray-500 transition-colors"
                        >
                          Detaylar
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
