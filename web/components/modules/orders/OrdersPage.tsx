"use client";

import Link from "next/link";
import { useMyOrders } from "@/queries/useOrders";
import { ORDER_STATUS_LABELS } from "@/types/enums";
import type { OrderStatus } from "@/types/enums";
import { useState } from "react";
import type { Order } from "@/types/entities";
import {
  ChevronUp,
  ChevronDown,
  Truck,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  MapPin,
  Package,
  Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & pure helpers
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled/Failed" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

function statusMatch(status: OrderStatus, filter: FilterKey | string): boolean {
  if (filter === "all") return true;
  if (filter === "active")
    return !["DELIVERED", "FAILED", "CANCELLED"].includes(status);
  if (filter === "CANCELLED")
    return status === "CANCELLED" || status === "FAILED";
  return status === filter;
}

// Maps each OrderStatus to design-system token strings (no raw hex)
function statusTokens(status: OrderStatus): {
  text: string;
  bg: string;
  border: string;
  accent: string | null;
} {
  switch (status) {
    case "DELIVERED":
      return {
        text: "var(--success)",
        bg: "var(--success-bg)",
        border: "var(--success-border)",
        accent: "var(--success)",
      };
    case "OUT_FOR_DELIVERY":
      return {
        text: "var(--danger)",
        bg: "var(--danger-bg)",
        border: "var(--danger-border)",
        accent: "var(--danger)",
      };
    case "IN_TRANSIT":
    case "PICKED_UP":
      return {
        text: "var(--info)",
        bg: "var(--info-bg)",
        border: "var(--info-border)",
        accent: null,
      };
    case "PAYMENT_CONFIRMED":
    case "LABEL_GENERATED":
    case "COURIER_ASSIGNED":
      return {
        text: "var(--warning)",
        bg: "var(--warning-bg)",
        border: "var(--warning-border)",
        accent: null,
      };
    case "FAILED":
    case "CANCELLED":
      return {
        text: "var(--text-secondary)",
        bg: "rgba(51,51,51,0.06)",
        border: "rgba(51,51,51,0.12)",
        accent: null,
      };
    default: // PENDING
      return {
        text: "var(--charcoal-soft)",
        bg: "rgba(51,51,51,0.05)",
        border: "rgba(51,51,51,0.10)",
        accent: null,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard skeleton
// ─────────────────────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-(--border-light) p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-44 rounded" />
        </div>
        <div className="space-y-2 text-right shrink-0">
          <Skeleton className="h-6 w-20 rounded ml-auto" />
          <Skeleton className="h-3 w-12 rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard
// ─────────────────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  const st = statusTokens(order.status);
  const label = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const isDelivered = order.status === "DELIVERED";
  const hasTracking = !!order.shipment?.trackingNumber;

  // Derive typed extras that may exist after the Module 3 / architecture upgrade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyOrder = order as any;
  const address = anyOrder.shippingAddress ?? null;

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ border: "1px solid rgba(51,51,51,0.08)" }}
    >
      {/* Delivered top-accent bar */}
      {st.accent && (
        <div className="h-0.5 w-full" style={{ background: st.accent }} />
      )}

      {/* ── Collapsed header ───────────────────────────────────────────────── */}
      {/*
       * min-h ensures the tap target always reaches 52px on mobile
       * hover:bg- uses the Tailwind design-token class (no JS mutation needed)
       */}
      <button
        className="w-full text-left p-4 md:p-5 hover:bg-(--off-white) transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{ minHeight: 72 }}
      >
        <div className="flex items-start justify-between gap-3 md:gap-4">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Status badge + meta chips */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  color: st.text,
                  background: st.bg,
                  borderColor: st.border,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {label}
              </span>

              {/* Source + rate — visible sm+ only (shown in expanded panel on mobile) */}
              <span
                className="hidden sm:inline text-[11px]"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {order.source === "MARKETPLACE" ? "Marketplace" : "E-Store"}
                {" · "}
                {order.shippingRate === "EXPRESS"
                  ? "⚡ Express"
                  : "📦 Standard"}
              </span>
            </div>

            {/* Product name summary */}
            <p
              className="text-sm font-medium mb-1 pr-2"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span className="line-clamp-1">
                {order.items
                  .slice(0, 2)
                  .map((i) => `${i.productName} ×${i.quantity}`)
                  .join(", ")}
                {order.items.length > 2 && (
                  <span style={{ color: "var(--charcoal-soft)" }}>
                    {" "}
                    +{order.items.length - 2} more
                  </span>
                )}
              </span>
            </p>

            {/* Order ID + date  */}
            <p
              className="font-mono text-[11px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              #{order.id.slice(0, 8).toUpperCase()}
              {" · "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Right column — price + item count + chevron */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p
              className="font-bold leading-none"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
              }}
            >
              {formatPrice(order.totalAmount)}
            </p>
            <span
              className="text-[10px]"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
            <span className="mt-0.5" style={{ color: "var(--charcoal-soft)" }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </div>
      </button>

      {/* ── Expanded detail panel ───────────────────────────────────────────── */}
      {expanded && (
        <div
          className="px-4 md:px-5 pb-4 md:pb-5 pt-0 space-y-4"
          style={{
            borderTop: "1px solid rgba(51,51,51,0.06)",
            background: "var(--off-white)",
          }}
        >
          {/* Mobile-only source + rate chips */}
          <div className="flex items-center gap-2 pt-4 sm:hidden">
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(51,51,51,0.06)",
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {order.source === "MARKETPLACE" ? "Marketplace" : "E-Store"}
            </span>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(51,51,51,0.06)",
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {order.shippingRate === "EXPRESS" ? "⚡ Express" : "📦 Standard"}
            </span>
          </div>

          {/* Product list */}
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Products
            </p>
            <div className="space-y-3">
              {order.items.map((item) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyItem = item as any;
                const image: string | null =
                  anyItem.productImage ?? anyItem.productImageUrl ?? null;
                const variants: Record<string, string> | null =
                  anyItem.variantAttributes ?? null;

                return (
                  <div key={item.id} className="flex items-start gap-3">
                    {/* Thumbnail — shown when available */}
                    {image ? (
                      <img
                        src={image}
                        alt={item.productName}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shrink-0"
                        style={{ border: "1px solid rgba(51,51,51,0.08)" }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(51,51,51,0.06)" }}
                      >
                        <Package
                          size={14}
                          style={{ color: "var(--charcoal-soft)" }}
                        />
                      </div>
                    )}

                    {/* Name + variant attrs */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{
                          color: "var(--charcoal)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {item.productName}
                      </p>
                      {variants && Object.keys(variants).length > 0 && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{
                            color: "var(--charcoal-soft)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {Object.entries(variants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p
                        className="text-[11px] mt-0.5"
                        style={{
                          color: "var(--charcoal-soft)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        ×{item.quantity} · {formatPrice(item.unitPrice)} each
                      </p>
                    </div>

                    {/* Line total */}
                    <p
                      className="text-sm font-bold shrink-0"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Order total */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              Order Total
            </span>
            <span
              className="font-bold"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
              }}
            >
              {formatPrice(order.totalAmount)}
            </span>
          </div>

          {/* Shipping address */}
          {address && (
            <div
              className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
              style={{
                background: "white",
                border: "1px solid rgba(51,51,51,0.08)",
              }}
            >
              <MapPin
                size={13}
                className="shrink-0 mt-0.5"
                style={{ color: "var(--charcoal-soft)" }}
              />
              <p
                className="text-xs leading-relaxed"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {address.fullName && (
                  <>
                    <strong>{address.fullName}</strong>
                    {" — "}
                  </>
                )}
                {address.addressLine}, {address.city}
                {address.postalCode && ` ${address.postalCode}`}
              </p>
            </div>
          )}

          {/*
           * Action buttons
           * Mobile:  stacked full-width (flex-col)
           * Tablet+: side by side (sm:flex-row)
           * All buttons: min-h-11 to meet the 44px touch-target rule
           */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {/* Track order — primary, only when tracking exists */}
            {hasTracking && (
              <Link
                href={`/orders/${order.id}/tracking`}
                className="flex-1 flex items-center justify-center gap-2 min-h-11 px-4 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-85"
                style={{
                  background: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Truck size={14} />
                Track Order
                <ArrowRight size={13} />
              </Link>
            )}

            {/* Reorder — only for delivered orders */}
            {isDelivered && (
              <Link
                href={`/?reorder=${order.id}`}
                className="flex-1 flex items-center justify-center gap-2 min-h-11 px-4 text-sm font-semibold rounded-xl transition-colors hover:bg-(--off-white)"
                style={{
                  border: "1.5px solid rgba(51,51,51,0.15)",
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <RotateCcw size={13} />
                Reorder
              </Link>
            )}

            {/* Review — only for delivered orders */}
            {isDelivered && (
              <button
                type="button"
                onClick={() =>
                  toast.info("Product reviews are coming soon!", {
                    description: "You'll be able to rate your purchase here.",
                  })
                }
                className="flex-1 flex items-center justify-center gap-2 min-h-11 px-4 text-sm font-semibold rounded-xl transition-colors hover:bg-(--off-white)"
                style={{
                  border: "1.5px solid rgba(51,51,51,0.15)",
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <Star size={13} />
                Review
              </button>
            )}

            {/* Details — always present */}
            <Link
              href={`/orders/${order.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 min-h-11 px-4 text-sm font-semibold rounded-xl transition-colors hover:bg-(--off-white)"
              style={{
                border: "1.5px solid rgba(51,51,51,0.15)",
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            >
              Details
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data: orders = [], isLoading } = useMyOrders();

  const filtered = orders.filter((o) => statusMatch(o.status, filter));

  // Pre-compute tab counts to show the count badge without re-filtering on render
  const counts = Object.fromEntries(
    FILTER_TABS.map((t) => [
      t.key,
      orders.filter((o) => statusMatch(o.status, t.key)).length,
    ]),
  ) as Record<FilterKey, number>;

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div
        className="bg-white"
        style={{ borderBottom: "1px solid rgba(51,51,51,0.08)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-3 mb-2">
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
          {/* Responsive title: `text-3xl` mobile → `text-[2.2rem]` md+ */}
          <h1
            className="font-normal text-(--charcoal) text-[1.9rem] md:text-[2.2rem] leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My <em style={{ color: "var(--red)" }}>Orders</em>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/*
         * Filter tab bar
         *
         * Mobile:  horizontally scrollable (overflow-x-auto), no wrap
         *          — prevents "Cancelled/Failed" orphaning onto a second row
         * Tablet+: flex-wrap allowed (enough room)
         *
         * All buttons: minHeight 44px, `whitespace-nowrap shrink-0`
         * Scrollbar is hidden via inline styles for cross-browser support
         */}
        <div
          className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-1"
          style={{
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE / Edge legacy
            WebkitOverflowScrolling: "touch", // iOS momentum scroll
          }}
        >
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            const count = counts[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="inline-flex items-center gap-1.5 px-4 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap shrink-0"
                style={{
                  minHeight: 44,
                  background: active ? "var(--charcoal)" : "white",
                  color: active ? "white" : "var(--charcoal-soft)",
                  border: active
                    ? "1.5px solid var(--charcoal)"
                    : "1.5px solid rgba(51,51,51,0.12)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {tab.label}

                {/* Count badge */}
                {count > 0 && (
                  <span
                    className="inline-flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 leading-none"
                    style={{
                      minWidth: 18,
                      height: 18,
                      background: active
                        ? "rgba(255,255,255,0.22)"
                        : "rgba(51,51,51,0.08)",
                      color: active ? "white" : "var(--charcoal-soft)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────────────────── */
          <div className="text-center py-16 md:py-24">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto"
              style={{ background: "rgba(51,51,51,0.05)" }}
            >
              <ShoppingBag
                size={28}
                style={{ color: "var(--charcoal-soft)" }}
              />
            </div>
            <p
              className="text-base font-semibold mb-1"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            >
              {filter === "all" ? "No orders yet" : "No orders here"}
            </p>
            <p
              className="text-sm mb-6"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              {filter === "all"
                ? "Your order history will appear here once you place your first order."
                : "No orders match this filter. Try another tab."}
            </p>
            {filter === "all" && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 min-h-11 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-85"
                style={{
                  background: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Start Shopping
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          /* ── Order list ──────────────────────────────────────────────────── */
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
