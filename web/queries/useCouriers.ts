"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { STALE_TIME } from "@/lib/constants";
import type { Courier, Shipment } from "@/types/entities";
import type { ShipmentStatus } from "@/types/enums";
import type {
  AssignCourierRequest,
  UpdateShipmentStatusRequest,
  CalculateEtaRequest,
  CalculateEtaResponse,
} from "@/types/api";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const courierKeys = {
  all:         ["couriers"] as const,
  list:        ()          => [...courierKeys.all, "list"]         as const,
  detail:      (id: string) => [...courierKeys.all, "detail", id] as const,
  myProfile:   ()          => ["courier-me-profile"]              as const,
  myShipments: ()          => [...courierKeys.all, "my-shipments"] as const,
};

export const shipmentKeys = {
  all:        ["shipments"] as const,
  list:       (filters?: object) => [...shipmentKeys.all, "list", filters] as const,
  detail:     (id: string)       => [...shipmentKeys.all, "detail", id]    as const,
  byTracking: (trackingNo: string) =>
    [...shipmentKeys.all, "tracking", trackingNo] as const,
  eta: (params: CalculateEtaRequest) =>
    [...shipmentKeys.all, "eta", params] as const,
};

// ── Courier Profile type ──────────────────────────────────────────────────────

export interface CourierProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  vehicleType: string;
  plateNumber?: string;
  isActive: boolean;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  createdAt: string;
  stats: {
    totalDelivered: number;
    totalActive: number;
    todayDelivered: number;
  };
}

// ── Admin — Courier List ──────────────────────────────────────────────────────

export function useCouriers() {
  return useQuery({
    queryKey: courierKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Courier[]>("/api/couriers");
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useCourier(id: string) {
  return useQuery({
    queryKey: courierKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Courier>(`/api/couriers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── Admin — Shipments ────────────────────────────────────────────────────────

export function useShipments(filters?: { status?: string; courierId?: string }) {
  return useQuery({
    queryKey: shipmentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status)    params.set("status",    filters.status);
      if (filters?.courierId) params.set("courierId", filters.courierId);
      // Backend returns { data: Shipment[], pagination: {...} }. The interceptor
      // no longer auto-unwraps this shape now that "pagination" is in PAGINATION_KEYS.
      type PagedShipments = { data: Shipment[]; pagination: { page: number; limit: number; total: number; pages: number } };
      const { data } = await api.get<PagedShipments>(`/api/fulfillment?${params}`);
      return data.data;
    },
    staleTime: STALE_TIME.SHORT,
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Shipment>(`/api/fulfillment/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: STALE_TIME.SHORT,
  });
}

export function useShipmentByTrackingNo(trackingNo: string) {
  return useQuery({
    queryKey: shipmentKeys.byTracking(trackingNo),
    queryFn: async () => {
      const { data } = await api.get(`/api/fulfillment/events/${trackingNo}`);
      return data;
    },
    enabled: !!trackingNo,
    refetchInterval: 30_000, // 30-second polling fallback
    staleTime: STALE_TIME.SHORT,
  });
}

// ── Courier Portal — My Shipments ─────────────────────────────────────────────

export function useMyCourierShipments() {
  return useQuery({
    queryKey: courierKeys.myShipments(),
    queryFn: async () => {
      const { data } = await api.get<Shipment[]>(
        "/api/fulfillment/courier/my-shipments",
      );
      return data;
    },
    staleTime: STALE_TIME.SHORT,
    refetchInterval: 60_000,
  });
}

// ── ETA ───────────────────────────────────────────────────────────────────────

export function useCalculateEta(params: CalculateEtaRequest | null) {
  return useQuery({
    queryKey: params ? shipmentKeys.eta(params) : ["eta-disabled"],
    queryFn: async () => {
      // Backend FulfillmentController.CalculateEta expects:
      //   merchantId (Guid), destLat (double), destLng (double), shippingRate (string)
      const { data } = await api.get<CalculateEtaResponse>(
        "/api/fulfillment/calculate-eta",
        { params },
      );
      return data;
    },
    enabled: !!params,
    staleTime: STALE_TIME.MEDIUM,
  });
}

// ── Admin Mutations ───────────────────────────────────────────────────────────

export function useAssignCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignCourierRequest) =>
      api.post("/api/fulfillment/assign", body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(vars.shipmentId) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.list() });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateShipmentStatusRequest) =>
      api.patch(`/api/fulfillment/${id}/status`, body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.list() });
    },
  });
}

export function useGenerateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) =>
      api.post(`/api/fulfillment/${shipmentId}/generate-label`),
    onSuccess: (_, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) });
    },
  });
}

// ── Courier Mutations ─────────────────────────────────────────────────────────

export function useConfirmPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) =>
      api.post(`/api/fulfillment/${shipmentId}/pickup-confirm`),

    // Optimistic: courier taps "Picked Up" — status flips instantly
    onMutate: async (shipmentId) => {
      await queryClient.cancelQueries({ queryKey: courierKeys.myShipments() });
      const snapshot = queryClient.getQueryData<Shipment[]>(courierKeys.myShipments());
      queryClient.setQueryData<Shipment[]>(courierKeys.myShipments(), (old) =>
        old?.map((s) =>
          s.id === shipmentId
            ? { ...s, status: "PICKED_UP" as ShipmentStatus }
            : s,
        ),
      );
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(courierKeys.myShipments(), ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courierKeys.myShipments() });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) =>
      api.post(`/api/fulfillment/${shipmentId}/delivered`),

    // Optimistic: courier taps "Delivered" — status flips instantly
    onMutate: async (shipmentId) => {
      await queryClient.cancelQueries({ queryKey: courierKeys.myShipments() });
      const snapshot = queryClient.getQueryData<Shipment[]>(courierKeys.myShipments());
      queryClient.setQueryData<Shipment[]>(courierKeys.myShipments(), (old) =>
        old?.map((s) =>
          s.id === shipmentId
            ? { ...s, status: "DELIVERED" as ShipmentStatus }
            : s,
        ),
      );
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(courierKeys.myShipments(), ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courierKeys.myShipments() });
    },
  });
}

// ── Courier Location ──────────────────────────────────────────────────────────

/**
 * Sends the courier's current GPS coordinates to the backend.
 * The backend saves the location and broadcasts it to active shipment groups
 * via SignalR. No cache invalidation needed — location updates are high-frequency
 * and non-critical for cache consistency.
 */
export function useUpdateCourierLocation() {
  return useMutation({
    mutationFn: (coords: { latitude: number; longitude: number }) =>
      api.put("/api/couriers/me/location", coords),
    onError: (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[CourierLocation] Failed to send location:", err);
      }
    },
  });
}

// ── Courier Self Profile ──────────────────────────────────────────────────────

export function useMyCourierProfile() {
  return useQuery<CourierProfile>({
    queryKey: courierKeys.myProfile(),
    queryFn: async () => {
      const { data } = await api.get("/api/couriers/me");
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
    refetchInterval: 2 * 60_000,
  });
}

export function useToggleCourierAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/api/couriers/me/availability"),

    // Optimistic: availability toggle flips immediately so the UI doesn't stutter
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: courierKeys.myProfile() });
      const snapshot = queryClient.getQueryData<CourierProfile>(
        courierKeys.myProfile(),
      );
      queryClient.setQueryData<CourierProfile>(courierKeys.myProfile(), (old) =>
        old ? { ...old, isAvailable: !old.isAvailable } : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(courierKeys.myProfile(), ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courierKeys.myProfile() });
    },
  });
}
