"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import TrackingTimeline from "@/components/modules/fulfillment/TrackingTimeline";
import { ShipmentLabel } from "@/components/modules/shipping/ShipmentLabel";
import type { Shipment } from "@/types/entities";

import {
  ArrowLeft,
  Package,
  MapPin,
  CheckCircle2,
  Truck,
  Phone,
  Navigation,
} from "lucide-react";

// Extended local type for courier detail view (merchant/customer not in base Shipment entity)
interface ShipmentDetail extends Shipment {
  orderNumber: string;
  shippingRate: "EXPRESS" | "REGULAR";

  merchant: {
    name: string;
    address: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  };

  customer: {
    name: string;
    address: string;
    phone?: string;
  };

  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

export default function CourierShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shipmentId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["courier-shipment", shipmentId],
    queryFn: async () => {
      const res = await api.get(`/api/fulfillment/${shipmentId}`);
      return res.data;
    },
    enabled: !!shipmentId,
    refetchInterval: 30000,
  });

  const pickupMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(
        `/api/fulfillment/${shipmentId}/pickup-confirm`,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Package marked as picked up");
      queryClient.invalidateQueries({
        queryKey: ["courier-shipment", shipmentId],
      });
    },
    onError: () => toast.error("Action failed"),
  });

  const deliveredMutation = useMutation({
    mutationFn: async () => {
      const recipientName = prompt("Enter the recipient's name:");
      if (!recipientName) return;
      const res = await api.post(`/api/fulfillment/${shipmentId}/delivered`, {
        recipientName,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Delivery completed! ✓");
      queryClient.invalidateQueries({
        queryKey: ["courier-shipment", shipmentId],
      });
    },
    onError: () => toast.error("Action failed"),
  });

  const shipment: ShipmentDetail | null = data?.data || null;

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6 text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Shipment not found</p>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => router.push("/courier/shipments")}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const canPickup = shipment.status === "COURIER_ASSIGNED";
  const canDeliver =
    shipment.status === "PICKED_UP" ||
    shipment.status === "IN_TRANSIT" ||
    shipment.status === "OUT_FOR_DELIVERY";
  const isCompleted =
    shipment.status === "DELIVERED" || shipment.status === "FAILED";

  const statusColor =
    shipment.status === "DELIVERED"
      ? "bg-green-100 text-green-700"
      : shipment.status === "FAILED"
        ? "bg-red-100 text-red-700"
        : shipment.status === "COURIER_ASSIGNED"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-blue-100 text-blue-700";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/courier/shipments")}
          className="text-gray-500 p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--charcoal)]">
            Shipment Details
          </h1>
          <p className="text-xs font-mono text-[var(--red)]">
            {shipment.trackingNumber}
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusColor}`}
        >
          {shipment.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* ── Action Buttons ───────────────────────────────────── */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-14 text-sm font-semibold"
            disabled={!canPickup || pickupMutation.isPending}
            onClick={() => pickupMutation.mutate()}
          >
            <Package className="w-5 h-5 mr-2" />
            {pickupMutation.isPending ? "Processing..." : "Picked Up"}
          </Button>
          <Button
            className="h-14 text-sm font-semibold bg-green-600 hover:bg-green-700"
            disabled={!canDeliver || deliveredMutation.isPending}
            onClick={() => deliveredMutation.mutate()}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {deliveredMutation.isPending ? "Processing..." : "Delivered"}
          </Button>
        </div>
      )}

      {isCompleted && shipment.status === "DELIVERED" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
          <p className="text-green-700 font-semibold text-sm">
            Delivery Completed
          </p>
          {shipment.actualDeliveredAt && (
            <p className="text-green-600 text-xs mt-1 font-mono">
              {new Date(shipment.actualDeliveredAt).toLocaleString("tr-TR")}
            </p>
          )}
        </div>
      )}

      {/* ── Shipment Label — ShipmentLabel component ─────────── */}
      <ShipmentLabel
        shipment={shipment}
        canGenerate={false}
        onGenerated={() =>
          queryClient.invalidateQueries({
            queryKey: ["courier-shipment", shipmentId],
          })
        }
      />

      {/* ── Addresses ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {/* Merchant / Pickup */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-lg mt-0.5">
                <Package className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--charcoal-soft)] uppercase tracking-wide mb-1">
                  Pickup Address (Merchant)
                </p>
                <p className="text-sm font-semibold text-[var(--charcoal)]">
                  {shipment.merchant.name}
                </p>
                <p className="text-sm text-[var(--charcoal-soft)] mt-0.5">
                  {shipment.merchant.address}
                </p>
                {shipment.merchant.phone && (
                  <a
                    href={`tel:${shipment.merchant.phone}`}
                    className="flex items-center gap-1 text-sm text-[var(--red)] mt-1.5 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {shipment.merchant.phone}
                  </a>
                )}
              </div>
              {shipment.merchant.latitude && shipment.merchant.longitude && (
                <a
                  href={`https://maps.google.com/?q=${shipment.merchant.latitude},${shipment.merchant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--red)]"
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer / Delivery */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg mt-0.5">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--charcoal-soft)] uppercase tracking-wide mb-1">
                  Delivery Address (Customer)
                </p>
                <p className="text-sm font-semibold text-[var(--charcoal)]">
                  {shipment.customer.name}
                </p>
                <p className="text-sm text-[var(--charcoal-soft)] mt-0.5">
                  {shipment.customer.address}
                </p>
                {shipment.customer.phone && (
                  <a
                    href={`tel:${shipment.customer.phone}`}
                    className="flex items-center gap-1 text-sm text-[var(--red)] mt-1.5 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {shipment.customer.phone}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Order Items ───────────────────────────────────────── */}
      {shipment.items?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--charcoal)]">
              Order Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shipment.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[var(--charcoal-soft)]">
                  {item.productName}
                </span>
                <span className="font-medium text-[var(--charcoal)] bg-[var(--off-white-2)] px-2 py-0.5 rounded text-xs font-mono">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Status Timeline — TrackingTimeline component ─────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--charcoal)]">
            <Truck className="w-4 h-4 text-[var(--charcoal-soft)]" />
            Shipment Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingTimeline
            currentStatus={shipment.status}
            events={shipment.events ?? []}
            trackingNumber={shipment.trackingNumber}
            courierName={shipment.courierName}
            courierPhone={shipment.courierPhone}
            courierVehicle={shipment.courierVehicle}
            estimatedDeliveryStart={shipment.estimatedDeliveryStart}
            estimatedDeliveryEnd={shipment.estimatedDeliveryEnd}
            isFailed={shipment.status === "FAILED"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
