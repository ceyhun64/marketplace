"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOrder } from "@/queries/useOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { Button }   from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, Package, Truck, MapPin, ShoppingBag,
  FileText, ArrowRight, ChevronRight, Download, Star,
  Home, Clock, Phone, PartyPopper,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/types/enums";

// -- Animated checkmark --------------------------------------------------------

function AnimatedCheck() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring pulse */}
      <div
        className="absolute rounded-full transition-all duration-700"
        style={{
          width:      mounted ? "100px" : "60px",
          height:     mounted ? "100px" : "60px",
          background: "rgba(13,122,78,0.06)",
          opacity:    mounted ? 1 : 0,
        }}
      />
      {/* Middle ring */}
      <div
        className="absolute rounded-full transition-all duration-500 delay-100"
        style={{
          width:      mounted ? "76px" : "52px",
          height:     mounted ? "76px" : "52px",
          background: "rgba(13,122,78,0.09)",
          opacity:    mounted ? 1 : 0,
        }}
      />
      {/* Icon circle */}
      <div
        className="relative rounded-full flex items-center justify-center transition-all duration-400 delay-200"
        style={{
          width:      "56px",
          height:     "56px",
          background: mounted ? "var(--success)" : "rgba(13,122,78,0.2)",
          transform:  mounted ? "scale(1)" : "scale(0.6)",
          opacity:    mounted ? 1 : 0,
        }}
      >
        <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>
    </div>
  );
}

// -- Delivery timeline step ----------------------------------------------------

interface TimelineStep {
  icon:   React.ReactNode;
  label:  string;
  desc:   string;
  done:   boolean;
  active: boolean;
}

function DeliveryTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div
        className="absolute left-5 top-5 bottom-5 w-px"
        style={{ background: "rgba(51,51,51,0.08)" }}
      />
      <div className="space-y-0">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-4 py-4 relative">
            {/* Dot / icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all"
              style={{
                background: s.done
                  ? "var(--success)"
                  : s.active
                  ? "var(--charcoal)"
                  : "var(--off-white-2)",
                border: s.active ? "2px solid var(--charcoal)" : "2px solid transparent",
                color: s.done || s.active ? "#fff" : "var(--charcoal-mist)",
              }}
            >
              {s.icon}
            </div>
            <div className="flex-1 pt-2.5 min-w-0">
              <p
                className="text-sm font-bold leading-none mb-0.5"
                style={{
                  color:      s.done || s.active ? "var(--charcoal)" : "var(--charcoal-mist)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {s.label}
              </p>
              <p className="text-xs" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}>
                {s.desc}
              </p>
            </div>
            {s.done && (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-3" style={{ color: "var(--success)" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Quick action cards --------------------------------------------------------

function ActionCard({
  icon, title, desc, href, variant = "default",
}: {
  icon:     React.ReactNode;
  title:    string;
  desc:     string;
  href:     string;
  variant?: "default" | "primary";
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
      style={{
        background: variant === "primary" ? "var(--charcoal)" : "#fff",
        border: `1px solid ${variant === "primary" ? "var(--charcoal)" : "rgba(51,51,51,0.08)"}`,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => { if (variant !== "primary") (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--charcoal)"; }}
      onMouseLeave={(e) => { if (variant !== "primary") (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(51,51,51,0.08)"; }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: variant === "primary" ? "rgba(255,255,255,0.1)" : "var(--off-white-2)",
          color: variant === "primary" ? "#fff" : "var(--charcoal-soft)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: variant === "primary" ? "#fff" : "var(--charcoal)", fontFamily: "var(--font-body)" }}
        >
          {title}
        </p>
        <p
          className="text-[12px] mt-0.5 truncate"
          style={{ color: variant === "primary" ? "rgba(255,255,255,0.5)" : "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
        >
          {desc}
        </p>
      </div>
      <ChevronRight
        className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform"
        style={{ color: variant === "primary" ? "rgba(255,255,255,0.4)" : "var(--charcoal-mist)" }}
      />
    </Link>
  );
}

// -- Main component ------------------------------------------------------------

// -- Timeline helpers ----------------------------------------------------------

// Order status progression — used to derive done/active state for each step.
const STATUS_PROGRESSION = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "LABEL_GENERATED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

function parseShippingAddress(addr: unknown): string {
  if (!addr) return "Your delivery address";
  if (typeof addr === "string") {
    try {
      const parsed = JSON.parse(addr) as { city?: string; addressLine?: string };
      return [parsed.city, parsed.addressLine].filter(Boolean).join(", ");
    } catch {
      return addr;
    }
  }
  const a = addr as { city?: string; addressLine?: string };
  return [a.city, a.addressLine].filter(Boolean).join(", ") || "Your delivery address";
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const { data: order, isLoading, isError } = useOrder(orderId);

  // Derive timeline step state from actual order status (not hardcoded).
  const statusIdx = STATUS_PROGRESSION.indexOf(
    (order?.status ?? "PENDING") as typeof STATUS_PROGRESSION[number],
  );

  const timelineSteps: TimelineStep[] = [
    {
      icon:   <CheckCircle2 className="w-4 h-4" />,
      label:  "Order Confirmed",
      desc:   "Your order has been received and is being processed.",
      done:   statusIdx > 0,
      active: statusIdx === 0,
    },
    {
      icon:   <Package className="w-4 h-4" />,
      label:  "Packing",
      desc:   "The merchant is preparing your items for dispatch.",
      done:   statusIdx > 2,
      active: statusIdx === 1 || statusIdx === 2,
    },
    {
      icon:   <Truck className="w-4 h-4" />,
      label:  "In Transit",
      desc:   "Your parcel is on its way to you.",
      done:   statusIdx > 5,
      active: statusIdx >= 3 && statusIdx <= 5,
    },
    {
      icon:   <Home className="w-4 h-4" />,
      label:  "Delivered",
      desc:   parseShippingAddress(order?.shippingAddress),
      done:   statusIdx === 7,
      active: statusIdx === 6,
    },
  ];

  return (
    <main
      className="min-h-screen flex items-start justify-center py-12 px-4"
      style={{ background: "var(--off-white)" }}
    >
      <div className="w-full max-w-2xl space-y-5">

        {/* -- Hero confirmation card -- */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid rgba(51,51,51,0.07)" }}
        >
          {/* Celebration strip */}
          <div
            className="py-1.5 text-center text-white text-[11px] font-bold uppercase tracking-[2px] font-mono flex items-center justify-center gap-2"
            style={{ background: "var(--success)" }}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            Order Confirmed
            <PartyPopper className="w-3.5 h-3.5" />
          </div>

          <div className="px-8 pt-10 pb-8 text-center">
            <AnimatedCheck />
            <h1
              className="mt-6 mb-2 leading-tight"
              style={{
                fontFamily:    "var(--font-display)",
                fontSize:      "clamp(1.875rem, 4vw, 2.5rem)",
                fontWeight:    400,
                color:         "var(--charcoal)",
                letterSpacing: "-0.025em",
              }}
            >
              Thank you for your order!
            </h1>

            {isLoading ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-48 mx-auto rounded" />
                <Skeleton className="h-3 w-36 mx-auto rounded" />
              </div>
            ) : isError || !order ? (
              <p className="text-sm mt-3" style={{ color: "var(--charcoal-soft)" }}>
                Your order has been placed successfully.
              </p>
            ) : (
              <div className="mt-4 space-y-1.5">
                <p className="text-sm" style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
                  Order{" "}
                  <span className="font-bold font-mono" style={{ color: "var(--charcoal)" }}>
                    #{order.id.split("-")[0].toUpperCase()}
                  </span>{" "}
                  placed on {formatDate(order.createdAt)}.
                </p>
                <p className="text-xs" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}>
                  A confirmation has been sent to your email.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* -- Order summary -- */}
        {(isLoading || order) && (
          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid rgba(51,51,51,0.07)" }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(51,51,51,0.06)" }}>
              <h2
                className="text-sm font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--charcoal)", fontFamily: "var(--font-mono)" }}
              >
                Order Summary
              </h2>
            </div>

            <div className="px-6 py-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/5" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : order ? (
                <>
                  {/* Items */}
                  <div className="space-y-3 mb-5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ background: "var(--off-white-2)", border: "1px solid rgba(51,51,51,0.07)" }}
                        >
                          {(item as any).productImageUrl || item.productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={(item as any).productImageUrl ?? item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5" style={{ color: "var(--charcoal-mist)" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold leading-tight truncate"
                            style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                          >
                            {item.productName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--charcoal-mist)" }}>
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <span
                          className="text-sm font-bold tabular-nums shrink-0"
                          style={{ color: "var(--charcoal)" }}
                        >
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator style={{ background: "rgba(51,51,51,0.06)" }} />

                  {/* Totals */}
                  <div className="space-y-2 pt-4">
                    {[
                      { label: "Subtotal",    value: order.totalAmount - order.shippingCost - (order.vatAmount ?? 0) },
                      { label: "Shipping",    value: order.shippingCost                                              },
                      { label: "VAT (20%)",   value: order.vatAmount ?? 0                                           },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>{row.label}</span>
                        <span className="font-semibold tabular-nums" style={{ color: "var(--charcoal)" }}>
                          {formatPrice(row.value)}
                        </span>
                      </div>
                    ))}
                    <Separator style={{ background: "rgba(51,51,51,0.06)" }} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: "var(--charcoal)" }}>Total</span>
                      <span
                        className="text-lg font-bold tabular-nums"
                        style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                      >
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* -- Delivery timeline -- */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid rgba(51,51,51,0.07)" }}
        >
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(51,51,51,0.06)" }}>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--charcoal)", fontFamily: "var(--font-mono)" }}>
              Delivery Progress
            </h2>
            {order?.shipment?.estimatedDeliveryEnd && (
              <span className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
                <Clock className="w-3.5 h-3.5" />
                Est. {formatDate(order.shipment.estimatedDeliveryEnd)}
              </span>
            )}
          </div>
          <div className="px-6 py-4">
            <DeliveryTimeline steps={timelineSteps} />
          </div>
        </div>

        {/* -- Shipping address -- */}
        {order?.shippingAddress && typeof order.shippingAddress !== "string" && (
          <div
            className="rounded-3xl px-6 py-5 flex items-start gap-4"
            style={{ background: "#fff", border: "1px solid rgba(51,51,51,0.07)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--off-white-2)" }}
            >
              <MapPin className="w-5 h-5" style={{ color: "var(--charcoal-soft)" }} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}>
                Delivering to
              </p>
              <p className="text-sm font-bold" style={{ color: "var(--charcoal)" }}>
                {order.shippingAddress.fullName}
              </p>
              <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
                {order.shippingAddress.addressLine}
              </p>
              <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
                {order.shippingAddress.district ? `${order.shippingAddress.district}, ` : ""}
                {order.shippingAddress.city} {order.shippingAddress.postalCode}
              </p>
              <p className="flex items-center gap-1 text-[12px] mt-1" style={{ color: "var(--charcoal-mist)" }}>
                <Phone className="w-3 h-3" />
                {order.shippingAddress.phone}
              </p>
            </div>
          </div>
        )}

        {/* -- Quick actions -- */}
        <div className="space-y-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] px-1"
            style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}>
            What&apos;s next?
          </h2>
          <ActionCard
            icon={<Truck className="w-5 h-5" />}
            title="Track Your Order"
            desc={order?.shipment?.trackingNumber ? `Tracking #${order.shipment.trackingNumber}` : "Get live delivery updates"}
            href={orderId ? `/orders/${orderId}/tracking` : "/orders"}
            variant="primary"
          />
          <ActionCard
            icon={<ShoppingBag className="w-5 h-5" />}
            title="Continue Shopping"
            desc="Explore thousands of products"
            href="/products"
          />
          {order?.invoicePdfUrl && (
            <ActionCard
              icon={<Download className="w-5 h-5" />}
              title="Download Invoice"
              desc={order.invoiceNumber ?? "View your VAT invoice"}
              href={order.invoicePdfUrl}
            />
          )}
          <ActionCard
            icon={<Star className="w-5 h-5" />}
            title="Leave a Review"
            desc="Share your experience with the seller"
            href={orderId ? `/orders/${orderId}` : "/orders"}
          />
        </div>

        {/* Footer */}
        <p
          className="text-center text-[11px] pb-6 font-mono uppercase tracking-[2px]"
          style={{ color: "var(--charcoal-mist)", opacity: 0.4 }}
        >
          Questions? Visit our{" "}
          <Link href="/help-center" className="underline hover:opacity-80 transition-opacity">
            Help Center
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
