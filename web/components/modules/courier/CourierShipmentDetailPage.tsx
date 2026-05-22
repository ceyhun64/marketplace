"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Package, MapPin, Clock, Printer, CheckCircle2,
  Truck, Phone, FileText, Navigation, LocateFixed, Wifi, WifiOff,
} from "lucide-react";
import { useUpdateCourierLocation } from "@/queries/useCouriers";

type ShipmentStatus =
  | "PLACED" | "PAYMENT_CONFIRMED" | "LABEL_GENERATED" | "COURIER_ASSIGNED"
  | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";

interface ShipmentDetail {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shippingRate: "EXPRESS" | "REGULAR";
  orderId: string;
  orderNumber: string;
  labelUrl?: string;
  merchant: { name: string; address: string; phone?: string; latitude?: number; longitude?: number };
  customer: { name: string; address: string; phone?: string };
  estimatedPickupWindow?: { start: string; end: string };
  estimatedDeliveryWindow?: { start: string; end: string };
  actualDeliveredAt?: string;
  items: Array<{ productName: string; quantity: number }>;
  events: Array<{ id: string; status: ShipmentStatus; note?: string; location?: string; createdAt: string; createdByName: string }>;
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PLACED: "Order Placed", PAYMENT_CONFIRMED: "Payment Confirmed",
  LABEL_GENERATED: "Label Generated", COURIER_ASSIGNED: "Courier Assigned",
  PICKED_UP: "Package Picked Up", IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", FAILED: "Failed",
};

function StatusPill({ status }: { status: ShipmentStatus }) {
  const t = status === "DELIVERED"
    ? { text: "text-(--success)", bg: "bg-(--success-bg)", border: "border-(--success-border)" }
    : status === "FAILED"
      ? { text: "text-(--danger)", bg: "bg-(--danger-bg)", border: "border-(--danger-border)" }
      : status === "COURIER_ASSIGNED"
        ? { text: "text-(--warning)", bg: "bg-(--warning-bg)", border: "border-(--warning-border)" }
        : { text: "text-(--info)", bg: "bg-(--info-bg)", border: "border-(--info-border)" };
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${t.text} ${t.bg} ${t.border}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function useCourierLocationBroadcast(active: boolean) {
  const { mutate: sendLocation } = useUpdateCourierLocation();
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const send = useCallback((coords: { latitude: number; longitude: number }) => {
    lastCoordsRef.current = coords;
    sendLocation(coords);
    setIsSending(true);
    setTimeout(() => setIsSending(false), 1500);
  }, [sendLocation]);

  useEffect(() => {
    if (!active) {
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    if (!navigator.geolocation) { setError("This device does not support location."); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { setError(null); send({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      (err) => setError(err.code === err.PERMISSION_DENIED ? "Location permission denied." : "Unable to retrieve location."),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );
    intervalRef.current = setInterval(() => { if (lastCoordsRef.current) sendLocation(lastCoordsRef.current); }, 30_000);
    return () => {
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [active, send, sendLocation]);

  return { isSending, error };
}

export default function CourierShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shipmentId = params.id as string;
  const [locationActive, setLocationActive] = useState(false);
  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [recipientName, setRecipientName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["courier-shipment", shipmentId],
    queryFn: async () => { const res = await api.get(`/api/fulfillment/${shipmentId}`); return res.data; },
    enabled: !!shipmentId,
    refetchInterval: 30000,
  });

  const pickupMutation = useMutation({
    mutationFn: async () => (await api.post(`/api/fulfillment/${shipmentId}/pickup-confirm`)).data,
    onSuccess: () => { toast.success("Package picked up"); setLocationActive(true); queryClient.invalidateQueries({ queryKey: ["courier-shipment", shipmentId] }); },
    onError: () => toast.error("Operation failed"),
  });

  const deliveredMutation = useMutation({
    mutationFn: async (name: string) =>
      (await api.post(`/api/fulfillment/${shipmentId}/delivered`, { recipientName: name || undefined })).data,
    onSuccess: () => {
      toast.success("Delivery completed ✓");
      setLocationActive(false);
      setDeliveryDialog(false);
      setRecipientName("");
      queryClient.invalidateQueries({ queryKey: ["courier-shipment", shipmentId] });
    },
    onError: () => toast.error("Operation failed"),
  });

  const shipment: ShipmentDetail | null = data?.data || null;

  useEffect(() => {
    if (!shipment) return;
    setLocationActive(["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status));
  }, [shipment?.status]);

  const { isSending, error: locationError } = useCourierLocationBroadcast(locationActive);

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6 text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-3 text-(--text-tertiary) opacity-20" />
        <p className="text-(--text-secondary)">Shipment not found</p>
        <Button variant="ghost" className="mt-3" onClick={() => router.push("/courier/shipments")}>Go Back</Button>
      </div>
    );
  }

  const canPickup = shipment.status === "COURIER_ASSIGNED";
  const canDeliver = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status);
  const isCompleted = shipment.status === "DELIVERED" || shipment.status === "FAILED";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/courier/shipments")} className="text-(--text-secondary) p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-(--text-primary)">Shipment Detail</h1>
          <p className="text-xs font-mono text-(--info)" style={{ color: "var(--info)" }}>{shipment.trackingNumber}</p>
        </div>
        <StatusPill status={shipment.status} />
      </div>

      {/* Konum Yayın Durumu */}
      {locationActive && (
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
          locationError ? "bg-(--danger-bg) text-(--danger) border-(--danger-border)"
            : isSending ? "bg-(--info-bg) text-(--info) border-(--info-border)"
            : "bg-(--success-bg) text-(--success) border-(--success-border)"
        }`}>
          {locationError ? (
            <><WifiOff className="w-3.5 h-3.5 shrink-0" /><span>{locationError}</span></>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isSending ? "var(--info)" : "var(--success)" }} />
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span>{isSending ? "Sending location..." : "Live location broadcasting"}</span>
              <button onClick={() => setLocationActive(false)} className="ml-auto text-xs underline opacity-60 hover:opacity-100">Stop</button>
            </>
          )}
        </div>
      )}

      {/* Konum Başlat */}
      {!locationActive && canDeliver && (
        <button
          onClick={() => setLocationActive(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-(--border-mid) text-xs text-(--text-secondary) hover:border-(--info-border) hover:text-(--info) hover:bg-(--info-bg) transition-all min-h-[44px]"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          Start Live Location Broadcast
        </button>
      )}

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-14 text-sm font-semibold bg-(--charcoal) hover:bg-(--charcoal-2) text-white rounded-xl"
            disabled={!canPickup || pickupMutation.isPending}
            onClick={() => pickupMutation.mutate()}
          >
            <Package className="w-5 h-5 mr-2" />
            {pickupMutation.isPending ? "Processing..." : "Picked Up"}
          </Button>
          <Button
            className="h-14 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: canDeliver ? "var(--success)" : undefined }}
            disabled={!canDeliver || deliveredMutation.isPending}
            onClick={() => setDeliveryDialog(true)}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Delivered
          </Button>
        </div>
      )}

      {/* Delivered Banner */}
      {isCompleted && shipment.status === "DELIVERED" && (
        <div className="bg-(--success-bg) border border-(--success-border) rounded-xl p-5 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--success)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--success)" }}>Delivery Completed</p>
          {shipment.actualDeliveredAt && <p className="text-xs mt-1 text-(--text-secondary)">{formatDateTime(shipment.actualDeliveredAt)}</p>}
        </div>
      )}

      {/* Label */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-(--off-white-2) rounded-xl">
            <FileText className="w-5 h-5 text-(--text-secondary)" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--text-primary)">Shipping Label</p>
            <p className="text-xs text-(--text-tertiary)">{shipment.labelUrl ? "Label ready" : "Label pending"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => shipment.labelUrl ? window.open(shipment.labelUrl, "_blank") : toast.error("Shipping label not yet generated")} disabled={!shipment.labelUrl} className="border-(--border-mid)">
          <Printer className="w-4 h-4 mr-1.5" />Print
        </Button>
      </div>

      {/* ETA */}
      {(shipment.estimatedPickupWindow || shipment.estimatedDeliveryWindow) && (
        <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5 space-y-3">
          <h3 className="text-sm font-semibold text-(--text-primary) flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "var(--info)" }} />
            Delivery Time Window
          </h3>
          {shipment.estimatedPickupWindow && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-(--text-secondary)">Pickup Window</span>
              <span className="font-medium text-(--text-primary)">{formatDateTime(shipment.estimatedPickupWindow.start)} – {formatDateTime(shipment.estimatedPickupWindow.end)}</span>
            </div>
          )}
          {shipment.estimatedDeliveryWindow && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-(--text-secondary)">Delivery Window</span>
              <span className="font-medium text-(--text-primary)">{formatDateTime(shipment.estimatedDeliveryWindow.start)} – {formatDateTime(shipment.estimatedDeliveryWindow.end)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-(--text-secondary)">Shipping Type</span>
            <span className={`font-semibold ${shipment.shippingRate === "EXPRESS" ? "text-(--warning)" : "text-(--text-primary)"}`}>
              {shipment.shippingRate === "EXPRESS" ? "⚡ Express" : "Standard"}
            </span>
          </div>
        </div>
      )}

      {/* Addresses */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-(--warning-bg) rounded-xl mt-0.5">
              <Package className="w-4 h-4" style={{ color: "var(--warning)" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide mb-1">Pickup Address (Seller)</p>
              <p className="text-sm font-semibold text-(--text-primary)">{shipment.merchant.name}</p>
              <p className="text-sm text-(--text-secondary) mt-0.5">{shipment.merchant.address}</p>
              {shipment.merchant.phone && (
                <a href={`tel:${shipment.merchant.phone}`} className="flex items-center gap-1 text-sm mt-1.5 hover:underline" style={{ color: "var(--info)" }}>
                  <Phone className="w-3.5 h-3.5" />{shipment.merchant.phone}
                </a>
              )}
            </div>
            {shipment.merchant.latitude && shipment.merchant.longitude && (
              <a href={`https://maps.google.com/?q=${shipment.merchant.latitude},${shipment.merchant.longitude}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="p-2" style={{ color: "var(--info)" }}>
                  <Navigation className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-(--success-bg) rounded-xl mt-0.5">
              <MapPin className="w-4 h-4" style={{ color: "var(--success)" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide mb-1">Delivery Address (Customer)</p>
              <p className="text-sm font-semibold text-(--text-primary)">{shipment.customer.name}</p>
              <p className="text-sm text-(--text-secondary) mt-0.5">{shipment.customer.address}</p>
              {shipment.customer.phone && (
                <a href={`tel:${shipment.customer.phone}`} className="flex items-center gap-1 text-sm mt-1.5 hover:underline" style={{ color: "var(--info)" }}>
                  <Phone className="w-3.5 h-3.5" />{shipment.customer.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      {shipment.items?.length > 0 && (
        <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5">
          <h3 className="text-sm font-semibold text-(--text-primary) mb-3">Order Contents</h3>
          <div className="space-y-2">
            {shipment.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-(--text-secondary)">{item.productName}</span>
                <span className="font-medium text-(--text-primary) bg-(--off-white-2) border border-(--border-light) px-2 py-0.5 rounded text-xs">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5">
        <h3 className="text-sm font-semibold text-(--text-primary) mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-(--text-tertiary)" />
          Status History
        </h3>
        {!shipment.events?.length ? (
          <p className="text-sm text-(--text-tertiary) text-center py-4">No status updates yet</p>
        ) : (
          <div className="space-y-0">
            {[...(shipment.events || [])].reverse().map((event, i, arr) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: i === 0 ? "var(--info)" : "var(--border-mid)", boxShadow: i === 0 ? "0 0 0 3px var(--info-bg)" : "none" }}
                  />
                  {i < arr.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: "var(--border-subtle)" }} />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-(--text-primary)">{STATUS_LABELS[event.status]}</p>
                  {event.note && <p className="text-xs text-(--text-secondary) mt-0.5">{event.note}</p>}
                  {event.location && (
                    <p className="text-xs text-(--text-tertiary) flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{event.location}
                    </p>
                  )}
                  <p className="text-xs text-(--text-tertiary) mt-1">{formatDateTime(event.createdAt)} · {event.createdByName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery confirmation dialog — replaces the broken window.prompt() */}
      <Dialog open={deliveryDialog} onOpenChange={(v) => { if (!v) { setDeliveryDialog(false); setRecipientName(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl bg-(--bg-sunken) border border-(--border-light) p-4 text-sm">
              <p className="font-semibold text-(--text-primary)">{shipment?.customer?.name}</p>
              <p className="text-xs text-(--text-secondary) mt-0.5">{shipment?.customer?.address}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-(--text-primary)">
                Recipient name <span className="text-(--text-tertiary) font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="Full name of the person who received the package"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="border-(--border-mid)"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => { setDeliveryDialog(false); setRecipientName(""); }}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deliveredMutation.isPending}
              onClick={() => deliveredMutation.mutate(recipientName)}
              style={{ backgroundColor: "var(--success)" }}
              className="text-white"
            >
              {deliveredMutation.isPending ? "Processing…" : "Confirm Delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
