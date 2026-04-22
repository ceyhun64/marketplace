"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { STALE_TIME } from "@/lib/constants";
import type { Courier, Shipment } from "@/types/entities";
import type {
  AssignCourierRequest,
  UpdateShipmentStatusRequest,
  CalculateEtaRequest,
  CalculateEtaResponse,
} from "@/types/api";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const courierKeys = {
  all: ["couriers"] as const,
  list: () => [...courierKeys.all, "list"] as const,
  detail: (id: string) => [...courierKeys.all, "detail", id] as const,
  myShipments: () => [...courierKeys.all, "my-shipments"] as const,
};

export const shipmentKeys = {
  all: ["shipments"] as const,
  list: (filters?: object) => [...shipmentKeys.all, "list", filters] as const,
  detail: (id: string) => [...shipmentKeys.all, "detail", id] as const,
  byTracking: (trackingNo: string) =>
    [...shipmentKeys.all, "tracking", trackingNo] as const,
  eta: (params: CalculateEtaRequest) =>
    [...shipmentKeys.all, "eta", params] as const,
};

// ── Courier List (Admin) ──────────────────────────────────────────────────────

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

// ── Fulfillment / Shipments (Admin) ───────────────────────────────────────────

export function useShipments(filters?: {
  status?: string;
  courierId?: string;
}) {
  return useQuery({
    queryKey: shipmentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.courierId) params.set("courierId", filters.courierId);
      const { data } = await api.get<Shipment[]>(`/api/fulfillment?${params}`);
      return data;
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

/**
 * QR kodu ile erişilen public tracking — takip numarasıyla.
 */
export function useShipmentByTrackingNo(trackingNo: string) {
  return useQuery({
    queryKey: shipmentKeys.byTracking(trackingNo),
    queryFn: async () => {
      const { data } = await api.get(`/api/fulfillment/events/${trackingNo}`);
      return data;
    },
    enabled: !!trackingNo,
    refetchInterval: 1000 * 30, // 30 sn polling
    staleTime: STALE_TIME.SHORT,
  });
}

// ── Kurye Portal (Courier) ────────────────────────────────────────────────────

/**
 * Kurye'nin kendi atanan paketleri.
 */
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
    refetchInterval: 1000 * 60, // 1 dakikada bir yenile
  });
}

// ── ETA Hesaplama ─────────────────────────────────────────────────────────────

export function useCalculateEta(params: CalculateEtaRequest | null) {
  return useQuery({
    queryKey: params ? shipmentKeys.eta(params) : ["eta-disabled"],
    queryFn: async () => {
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
      queryClient.invalidateQueries({
        queryKey: shipmentKeys.detail(vars.shipmentId),
      });
      queryClient.invalidateQueries({ queryKey: shipmentKeys.list() });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & UpdateShipmentStatusRequest) =>
      api.patch(`/api/fulfillment/${id}/status`, body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: shipmentKeys.detail(vars.id),
      });
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
      queryClient.invalidateQueries({
        queryKey: shipmentKeys.detail(shipmentId),
      });
    },
  });
}

// ── Courier Mutations ─────────────────────────────────────────────────────────

export function useConfirmPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) =>
      api.post(`/api/fulfillment/${shipmentId}/pickup-confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courierKeys.myShipments() });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) =>
      api.post(`/api/fulfillment/${shipmentId}/delivered`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courierKeys.myShipments() });
    },
  });
}
