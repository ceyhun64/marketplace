"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  PackageCheck,
  PackageSearch,
  Boxes,
  Send,
  Truck,
  MapPin,
  Clock,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  FileText,
  ClipboardList,
  CheckCircle2,
  Tag,
  User,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useOrder } from "@/queries/useOrders";
import { formatPrice, formatDateTime } from "@/lib/format";
import { NON_CANCELLABLE_STATUSES } from "@/types/enums";
import type { OrderStatus } from "@/types/enums";
import { toast } from "sonner";
import api from "@/lib/api";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { orderKeys } from "@/queries/useOrders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// -- Order lifecycle steps — Milestone 2 state machine ------------------------

const LIFECYCLE_STEPS: { status: OrderStatus; label: string; Icon: React.ElementType }[] =
  [
    { status: "PENDING", label: "Order Placed", Icon: ClipboardList },
    { status: "PAYMENT_CONFIRMED", label: "Payment Confirmed", Icon: CheckCircle2 },
    { status: "PROCESSING", label: "Processing", Icon: PackageSearch },
    { status: "PACKED", label: "Packed", Icon: Boxes },
    { status: "LABEL_GENERATED", label: "Label Generated", Icon: Tag },
    { status: "SHIPPED", label: "Shipped", Icon: Send },
    { status: "COURIER_ASSIGNED", label: "Courier Assigned", Icon: User },
    { status: "PICKED_UP", label: "Picked Up", Icon: Package },
    { status: "IN_TRANSIT", label: "In Transit", Icon: Truck },
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", Icon: MapPin },
    { status: "DELIVERED", label: "Delivered", Icon: PackageCheck },
  ];

const STATUS_ORDER: OrderStatus[] = LIFECYCLE_STEPS.map((s) => s.status);

function getStepIndex(status: OrderStatus): number {
  if (status === "FAILED" || status === "CANCELLED") return -1;
  return STATUS_ORDER.indexOf(status);
}

// -- Progress Stepper ----------------------------------------------------------

function OrderProgress({ status }: { status: OrderStatus }) {
  const currentIdx = getStepIndex(status);
  const isFailed = status === "FAILED" || status === "CANCELLED";

  if (isFailed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">
            {status === "CANCELLED" ? "Order Cancelled" : "Delivery Failed"}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            {status === "CANCELLED"
              ? "This order has been cancelled."
              : "Courier could not complete the delivery. Please contact support."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
        Order Status
      </p>
      <div className="space-y-0">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const isLast = idx === LIFECYCLE_STEPS.length - 1;

          return (
            <div key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                    isCurrent
                      ? "bg-gray-900 text-white ring-4 ring-gray-200 scale-110"
                      : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-300"
                  }`}
                >
                  {isDone ? (isCurrent ? <step.Icon className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />) : null}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 h-7 mt-1 ${idx < currentIdx ? "bg-emerald-400" : "bg-gray-100"}`}
                  />
                )}
              </div>
              <div className={`pb-5 ${isLast ? "pb-0" : ""} flex-1 pt-1`}>
                <p
                  className={`text-sm font-semibold ${
                    isCurrent
                      ? "text-gray-900"
                      : isDone
                        ? "text-emerald-700"
                        : "text-gray-300"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- Main Component ------------------------------------------------------------

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: order, isLoading } = useOrder(orderId);

  const canTrack =
    order &&
    [
      "COURIER_ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ].includes(order.status);

  const canCancel =
    order && !NON_CANCELLABLE_STATUSES.includes(order.status as OrderStatus);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelDialogOpen(false);
    try {
      await api.post(`/api/orders/${orderId}/cancel`);
      toast.success("Order cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    } catch {
      toast.error("Cancellation failed. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // -- Loading --------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
        <p className="text-gray-500 font-medium">Order not found.</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push("/orders")}
        >
          ← My Orders
        </Button>
      </div>
    );
  }

  const trackingNumber =
    (order as any).shipment?.trackingNumber ?? (order as any).trackingNumber;

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(51,51,51,0.08)",
          background: "#fff",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-5">
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            My Orders
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <StatusBadge type="order" status={order.status} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Milestone 2: Order lifecycle progress */}
        <OrderProgress status={order.status as OrderStatus} />

        {/* Track shipment button */}
        {canTrack && (
          <Link href={`/orders/${orderId}/tracking`}>
            <Button className="w-full gap-2 bg-gray-900 hover:bg-red-600 transition-colors">
              <Truck className="w-4 h-4" />
              Track Shipment
            </Button>
          </Link>
        )}

        {/* Public QR tracking link */}
        {trackingNumber && (
          <Link
            href={`/track/${trackingNumber}`}
            className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Public tracking page (shareable)
          </Link>
        )}

        {/* Delivery address */}
        {order.shippingAddress && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-0.5">
              {(() => {
                const addr = (() => {
                  if (typeof order.shippingAddress !== "string") return order.shippingAddress;
                  try {
                    return JSON.parse(order.shippingAddress) as import("@/types/entities").ShippingAddress;
                  } catch {
                    return null;
                  }
                })();
                if (!addr) return null;
                return (
                  <>
                    <p className="font-medium text-gray-900">{addr.fullName}</p>
                    <p>{addr.addressLine}</p>
                    <p>
                      {addr.district ? `${addr.district}, ` : ""}
                      {addr.city}
                    </p>
                    {addr.phone && (
                      <a
                        href={`tel:${addr.phone}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {addr.phone}
                      </a>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Shipping rate + ETA */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  <span className="flex items-center gap-1.5">
                    {order.shippingRate === "EXPRESS"
                      ? <><Zap className="w-3.5 h-3.5 text-amber-500" /> Express Shipping</>
                      : <><Package className="w-3.5 h-3.5 text-gray-500" /> Standard Shipping</>}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Shipping: {formatPrice(order.shippingCost ?? 0)}
                </p>
              </div>
            </div>
            {(order as any).shipment?.estimatedDeliveryStart && (
              <div className="text-right text-xs text-gray-500">
                <p className="font-medium text-gray-700">Est. Delivery</p>
                <p>
                  {new Date(
                    (order as any).shipment.estimatedDeliveryStart,
                  ).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order items */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              Items ({order.items?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(order.items ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order summary */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            {order.vatAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>VAT (20%)</span>
                <span>{formatPrice(order.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Shipping</span>
              <span>{formatPrice(order.shippingCost ?? 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-lg">{formatPrice(order.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Seller */}
        {order.merchantStoreName && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-mono">
                  Seller
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {order.merchantStoreName}
                </p>
              </div>
              {order.source && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                  {order.source === "MARKETPLACE" ? "Marketplace" : "E-Store"}
                </span>
              )}
            </CardContent>
          </Card>
        )}

        {/* Milestone 3: Fatura indirme — ödeme onaylandığında otomatik oluşur */}
        {order.invoicePdfUrl && (
          <a
            href={order.invoicePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:border-gray-300 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Invoice
                  {order.invoiceNumber && (
                    <span className="ml-1.5 font-mono text-xs text-gray-400">
                      #{order.invoiceNumber}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">Download PDF invoice</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
          </a>
        )}

        {/* Cancel order */}
        {canCancel && (
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setCancelDialogOpen(true)}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        )}

        {/* Cancel confirmation dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Cancel Order?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              This action cannot be undone. Your order will be cancelled and any payment will be refunded.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Keep Order
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
