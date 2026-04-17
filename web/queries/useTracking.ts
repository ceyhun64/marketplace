// queries/useTracking.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type ShipmentStatus =
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  merchantStoreName: string;
  merchantAddress: string;
  estimatedDelivery: string;
  labelUrl?: string;
  productSummary: string;
  orderNumber: string;
}

export interface ShipmentStatusHistory {
  status: string;
  note?: string;
  timestamp: string;
}

export interface TrackingDetail {
  orderId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  labelUrl?: string;
  courier?: {
    id: string;
    name: string;
    phone?: string;
  };
  history: ShipmentStatusHistory[];
}

export interface EtaResult {
  estimatedDelivery: string;
  distanceKm: number;
  handlingHours: number;
  transitHours: number;
}

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Kurye kendi atanmış shipment'larını getirir.
 * GET /api/fulfillment/courier/my-shipments?status=active|delivered|all
 */
export function useCourierShipments(filter: "active" | "delivered" | "all") {
  return useQuery<Shipment[]>({
    queryKey: ["courier-shipments", filter],
    queryFn: async () => {
      const { data } = await api.get("/api/fulfillment/courier/my-shipments", {
        params: { status: filter },
      });
      return data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/**
 * Sipariş tracking detayını getirir.
 * GET /api/orders/{id}/tracking
 */
export function useOrderTracking(orderId: string | null) {
  return useQuery<TrackingDetail>({
    queryKey: ["tracking", orderId],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${orderId}/tracking`);
      return data;
    },
    enabled: !!orderId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/**
 * Checkout sırasında ETA önizlemesi hesaplar.
 * GET /api/fulfillment/calculate-eta
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
      const { data } = await api.get("/api/fulfillment/calculate-eta", {
        params: { merchantId, destLat, destLng, shippingRate },
      });
      return data;
    },
    enabled:
      !!merchantId && destLat !== null && destLng !== null && !!shippingRate,
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

/**
 * Kurye: kargo teslim alındı onayla.
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
 * Kurye: teslim edildi onayla.
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
