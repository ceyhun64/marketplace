// queries/useTracking.ts — Courier-portal and public tracking helpers.
// useOrderTracking re-exports from useOrders.ts so all callers share the same
// TanStack Query cache key and receive SignalR-driven optimistic updates.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ShipmentStatus } from "@/types/enums";
import type { CalculateEtaResponse } from "@/types/api";

// ── Re-export — shared cache key ────────────────────────────────────────────
// Components that previously imported from this file continue to work.
// The underlying cache key is now orderKeys.tracking(id) so SignalR invalidation
// in use-signalr-tracking.ts reaches these components too.
export { useOrderTracking } from "./useOrders";

export interface ShipmentStatusHistory {
  id?: string;
  shipmentId?: string;
  status: string;
  note?: string;
  location?: string;
  createdAt: string;
  /** @deprecated use createdAt */
  timestamp?: string;
}

/**
 * Shape returned by GET /api/orders/{id}/tracking after the normalizer in useOrders.ts.
 * Components should prefer importing NormalizedTracking from useOrders.ts directly.
 */
export interface TrackingDetail {
  orderId: string;
  orderStatus: string;
  trackingNumber?: string;
  /** Shipment status — maps from backend ShipmentStatus field */
  status?: ShipmentStatus;
  estimatedDelivery?: string;
  estimatedDeliveryEnd?: string;
  labelUrl?: string;
  courierName?: string;
  courierPhone?: string;
  events: ShipmentStatusHistory[];
  actualDeliveredAt?: string;
}

/** Courier-portal shipment card shape from GET /api/fulfillment/courier/my-shipments */
export interface CourierShipment {
  id: string;
  trackingNumber: string;
  /** string rather than the full enum so components can narrow it locally */
  status: string;
  customerName: string;
  /** Formatted delivery address — normalized from backend customerAddress */
  deliveryAddress: string;
  /** Original backend field name kept as alias */
  customerAddress?: string;
  /** Merchant store name — normalized from backend merchantName */
  merchantStoreName: string;
  /** Original backend field name kept as alias */
  merchantName?: string;
  /** Not in backend response */
  merchantAddress?: string;
  /** Not in backend response */
  productSummary?: string;
  orderNumber?: string;
  estimatedDelivery: string;
  labelUrl?: string;
  courierName?: string;
  courierPhone?: string;
  shippingRate?: string;
  events: ShipmentStatusHistory[];
}

/** @deprecated Use CourierShipment */
export type Shipment = CourierShipment;

export interface EtaResult extends CalculateEtaResponse {
  /** Backward-compat alias: same as estimatedDeliveryEnd */
  estimatedDelivery?: string;
}

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetches shipments assigned to the current courier.
 * GET /api/fulfillment/courier/my-shipments
 */
export function useCourierShipments(filter: "active" | "delivered" | "all") {
  return useQuery<CourierShipment[]>({
    queryKey: ["courier-shipments", filter],
    queryFn: async () => {
      const { data } = await api.get("/api/fulfillment/courier/my-shipments", {
        params: { status: filter },
      });
      const raw: any[] = Array.isArray(data) ? data : ((data as any).data ?? data);
      // Normalize backend field names to the interface contract consumed by the courier portal
      return raw.map((s) => ({
        ...s,
        // Backend sends customerAddress; component reads deliveryAddress
        deliveryAddress: s.customerAddress ?? s.deliveryAddress ?? "",
        // Backend sends merchantName; component reads merchantStoreName
        merchantStoreName: s.merchantName ?? s.merchantStoreName ?? "",
      })) as CourierShipment[];
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/**
 * Checkout-time ETA preview.
 * GET /api/fulfillment/calculate-eta
 * Params: merchantId, destLat, destLng, shippingRate
 */
export function useCalculateEta(params: {
  merchantId: string | null;
  destLat: number | null;
  destLng: number | null;
  shippingRate: "EXPRESS" | "REGULAR" | null;
}) {
  const { merchantId, destLat, destLng, shippingRate } = params;

  return useQuery<EtaResult>({
    queryKey: ["eta", merchantId, destLat, destLng, shippingRate],
    queryFn: async () => {
      const { data } = await api.get<EtaResult>(
        "/api/fulfillment/calculate-eta",
        { params: { merchantId, destLat, destLng, shippingRate } },
      );
      // Backward-compat: populate estimatedDelivery from end of window
      if (!data.estimatedDelivery && data.estimatedDeliveryEnd) {
        data.estimatedDelivery = data.estimatedDeliveryEnd;
      }
      return data;
    },
    enabled:
      !!merchantId && destLat !== null && destLng !== null && !!shippingRate,
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

/**
 * Courier: confirm package pickup.
 * POST /api/fulfillment/{id}/pickup-confirm
 */
export function usePickupConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data } = await api.post(`/api/fulfillment/${id}/pickup-confirm`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-shipments"] });
    },
  });
}

/**
 * Courier: confirm delivery.
 * POST /api/fulfillment/{id}/delivered
 */
export function useDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      recipientName,
    }: {
      id: string;
      recipientName?: string;
    }) => {
      const { data } = await api.post(`/api/fulfillment/${id}/delivered`, {
        recipientName,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-shipments"] });
    },
  });
}
