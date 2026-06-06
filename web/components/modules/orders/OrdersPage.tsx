"use client";

import Link from "next/link";
import { useMyOrders } from "@/queries/useOrders";
import type { OrderStatus } from "@/types/enums";
import { useState } from "react";
import type { Order, OrderItem } from "@/types/entities";
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
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { formatPrice, formatDate } from "@/lib/format";
import api from "@/lib/api";

// -----------------------------------------------------------------------------
// Constants & pure helpers
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// OrderCard skeleton
// -----------------------------------------------------------------------------
// Review Modal
// -----------------------------------------------------------------------------

interface ReviewTarget {
  item: OrderItem;
  orderId: string;
}

function ReviewModal({
  target,
  onClose,
}: {
  target: ReviewTarget;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    setLoading(true);
    try {
      await api.post("/api/review", {
        productId: target.item.productId,
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
      });
      toast.success("Review submitted! Thank you.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to submit review.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--charcoal)" }}>
            Write a Review
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--charcoal-soft)" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Product info */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.5rem" }}>
            {(target.item.productImageUrl || target.item.productImage) && (
              <img
                src={target.item.productImageUrl ?? target.item.productImage}
                alt={target.item.productName}
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border-light)" }}
              />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--charcoal)" }}>
                {target.item.productName}
              </div>
              {target.item.merchantStoreName && (
                <div style={{ fontSize: "0.8125rem", color: "var(--charcoal-soft)" }}>
                  {target.item.merchantStoreName}
                </div>
              )}
            </div>
          </div>

          {/* Star rating */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--charcoal-mid)", letterSpacing: "0.04em", display: "block", marginBottom: "0.625rem" }}>
              RATING *
            </label>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <Star
                    size={28}
                    style={{
                      color: n <= (hovered || rating) ? "#f59e0b" : "var(--border-mid)",
                      fill: n <= (hovered || rating) ? "#f59e0b" : "transparent",
                      transition: "color 0.1s, fill 0.1s",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--charcoal-mid)", letterSpacing: "0.04em", display: "block", marginBottom: "0.375rem" }}>
              TITLE
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great quality!"
              maxLength={100}
              style={{
                width: "100%", padding: "0.625rem 0.875rem",
                border: "1.5px solid var(--border-mid)", borderRadius: 10,
                fontFamily: "var(--font-body)", fontSize: "0.875rem",
                color: "var(--charcoal)", outline: "none",
                background: "var(--off-white)", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Comment */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--charcoal-mid)", letterSpacing: "0.04em", display: "block", marginBottom: "0.375rem" }}>
              COMMENT
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              maxLength={1000}
              style={{
                width: "100%", padding: "0.625rem 0.875rem",
                border: "1.5px solid var(--border-mid)", borderRadius: 10,
                fontFamily: "var(--font-body)", fontSize: "0.875rem",
                color: "var(--charcoal)", outline: "none", resize: "vertical",
                background: "var(--off-white)", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "0.75rem", border: "1.5px solid var(--border-mid)",
                borderRadius: 12, background: "transparent",
                color: "var(--charcoal-soft)", fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              style={{
                flex: 1, padding: "0.75rem", border: "none",
                borderRadius: 12,
                background: rating > 0 ? "var(--charcoal)" : "var(--off-white-3)",
                color: rating > 0 ? "white" : "var(--charcoal-mist)",
                fontWeight: 700, cursor: rating > 0 ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// OrderCard
// -----------------------------------------------------------------------------

function OrderCard({ order, onReview }: { order: Order; onReview: (item: OrderItem) => void }) {
  const [expanded, setExpanded] = useState(false);

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
      {order.status === "DELIVERED" && (
        <div className="h-0.5 w-full" style={{ background: "var(--success)" }} />
      )}

      {/* -- Collapsed header ------------------------------------------------- */}
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
              <StatusBadge type="order" status={order.status} />

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
              {formatDate(order.createdAt)}
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

      {/* -- Expanded detail panel --------------------------------------------- */}
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
                onClick={() => {
                  const firstItem = order.items[0];
                  if (firstItem) onReview(firstItem);
                }}
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

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function OrdersPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data: orders = [], isLoading } = useMyOrders();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const filtered = orders.filter((o) => statusMatch(o.status, filter));

  // Pre-compute tab counts to show the count badge without re-filtering on render
  const counts = Object.fromEntries(
    FILTER_TABS.map((t) => [
      t.key,
      orders.filter((o) => statusMatch(o.status, t.key)).length,
    ]),
  ) as Record<FilterKey, number>;

  return (
    <>
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* -- Page header ------------------------------------------------------- */}
      <div
        className="relative overflow-hidden py-10 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Decorative package watermark */}
        <Package
          className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ width: 96, height: 96, color: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="absolute -top-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ border: "20px solid rgba(200,16,46,0.07)" }}
        />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Package style={{ width: 14, height: 14, color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              My Account
            </span>
          </div>
          <h1
            className="font-normal leading-tight text-white text-[1.9rem] md:text-[2.4rem]"
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

        {/* -- Content -------------------------------------------------------- */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* -- Empty state ---------------------------------------------------- */
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
              {filter === "all"
                ? "No orders yet"
                : filter === "active"
                  ? "No active orders"
                  : filter === "DELIVERED"
                    ? "No delivered orders"
                    : "No cancelled orders"}
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
                : filter === "active"
                  ? "You have no active or in-progress orders right now."
                  : filter === "DELIVERED"
                    ? "Orders that have been delivered will show here."
                    : "Cancelled or failed orders will show here."}
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
          /* -- Order list ---------------------------------------------------- */
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReview={(item) => setReviewTarget({ item, orderId: order.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    {reviewTarget && (
      <ReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
    )}
    </>
  );
}
