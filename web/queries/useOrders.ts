"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Order, Shipment } from "@/types/entities";
import type { OrderStatus } from "@/types/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaginatedOrders {
  items: Order[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface CreateOrderDto {
  items: { productId: string; quantity: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district?: string;
    postalCode: string;
  };
  shippingRate: "EXPRESS" | "REGULAR";
  source: "MARKETPLACE" | "ESTORE";
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const orderKeys = {
  all: ["orders"] as const,
  myOrders: (status?: string) => [...orderKeys.all, "mine", status] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  tracking: (id: string) => [...orderKeys.all, "tracking", id] as const,
  merchantIncoming: (status?: string) =>
    [...orderKeys.all, "merchant", status] as const,
  adminAll: (filters?: object) => [...orderKeys.all, "admin", filters] as const,
};

// ── Customer Hooks ────────────────────────────────────────────────────────────

interface PaginatedOrdersResponse {
  data: Order[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function useMyOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: orderKeys.myOrders(status),
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const { data } = await api.get<PaginatedOrdersResponse>(`/api/orders${params}`);
      if (!Array.isArray(data?.data)) {
        throw new Error(
          `Unexpected orders response shape: ${JSON.stringify(data).slice(0, 200)}`,
        );
      }
      return data.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Order>(`/api/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useOrderTracking(id: string) {
  return useQuery({
    queryKey: orderKeys.tracking(id),
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}/tracking`);
      // API returns OrderTrackingDto — normalize to match OrderTrackingPage field access
      const raw = data ?? {};
      return {
        orderId: raw.orderId as string,
        orderStatus: raw.orderStatus as string,
        trackingNumber: raw.trackingNumber as string | undefined,
        // Page uses "status" — API returns "shipmentStatus"
        status: (raw.shipmentStatus ?? raw.status) as string | undefined,
        estimatedDelivery: raw.estimatedDelivery as string | undefined,
        estimatedDeliveryEnd: raw.estimatedDelivery as string | undefined,
        labelUrl: raw.labelUrl as string | undefined,
        courierName: raw.courierName as string | undefined,
        courierPhone: raw.courierPhone as string | undefined,
        // Page uses "events" — API returns "history"
        events: (raw.history ?? raw.events ?? []) as Array<{
          id?: string;
          status: string;
          note?: string;
          location?: string;
          createdAt: string;
        }>,
        actualDeliveredAt: raw.actualDeliveredAt as string | undefined,
      };
    },
    enabled: !!id,
    // SignalR yokken polling fallback — 30 saniye
    refetchInterval: 1000 * 30,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderDto) =>
      api.post<{ orderId: string }>("/api/orders", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/api/orders/${orderId}/cancel`),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    },
  });
}

// ── Merchant Hooks ────────────────────────────────────────────────────────────

export function useMerchantIncomingOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: orderKeys.merchantIncoming(status),
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const { data } = await api.get<PaginatedOrdersResponse>(
        `/api/orders/merchant/incoming${params}`,
      );
      if (!Array.isArray(data?.data)) {
        throw new Error(
          `Unexpected merchant orders response shape: ${JSON.stringify(data).slice(0, 200)}`,
        );
      }
      return data.data;
    },
  });
}

export function usePackOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.patch(`/api/orders/${orderId}/pack`),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.merchantIncoming() });
    },
  });
}

// ── Admin Hooks ───────────────────────────────────────────────────────────────

export function useAdminOrders(filters?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  merchantId?: string;
}) {
  return useQuery({
    queryKey: orderKeys.adminAll(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.status) params.set("status", filters.status);
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      const { data } = await api.get<PaginatedOrders>(
        `/api/orders/admin/all?${params}`,
      );
      // API returns { data: orders[], pagination: { page, limit, total, pages } }
      // Normalize to PaginatedOrders: { items, totalCount, page, limit }
      const raw = data as unknown as {
        data?: Order[];
        pagination?: { page: number; limit: number; total: number };
        items?: Order[];
        totalCount?: number;
      };
      if (raw.data !== undefined) {
        return {
          items: raw.data,
          totalCount: raw.pagination?.total ?? 0,
          page: raw.pagination?.page ?? 1,
          limit: raw.pagination?.limit ?? 20,
        } as PaginatedOrders;
      }
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.adminAll() });
    },
  });
}

// ── Public Tracking (QR erişimli, token gerektirmez) ─────────────────────────

export function usePublicTracking(trackingNo: string) {
  return useQuery({
    queryKey: ["tracking", "public", trackingNo],
    queryFn: async () => {
      const { data } = await api.get(`/api/fulfillment/events/${trackingNo}`);
      return data;
    },
    enabled: !!trackingNo,
    refetchInterval: 1000 * 60, // 1 dakika polling
  });
}
