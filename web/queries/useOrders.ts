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
  items: { productId: string; quantity: number; variantId?: string }[];
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
  all:              ["orders"] as const,
  myOrders:        (status?: string) => [...orderKeys.all, "mine", status] as const,
  detail:          (id: string)      => [...orderKeys.all, "detail", id] as const,
  tracking:        (id: string)      => [...orderKeys.all, "tracking", id] as const,
  merchantIncoming:(status?: string) => [...orderKeys.all, "merchant", status] as const,
  adminAll:        (filters?: object)=> [...orderKeys.all, "admin", filters] as const,
};

// ── Normalizer ────────────────────────────────────────────────────────────────

interface PaginatedOrdersBackend {
  data?: Order[];
  pagination?: { page: number; limit: number; total: number };
  items?: Order[];
  totalCount?: number;
}

// ── Customer Hooks ────────────────────────────────────────────────────────────

interface PaginatedOrdersResponse {
  data: Order[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function useMyOrders(
  status?: OrderStatus,
  options?: { enabled?: boolean },
) {
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
    // Allow callers to disable the query (e.g. when the user is not a Customer)
    enabled: options?.enabled !== false,
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

// ── Order Tracking ────────────────────────────────────────────────────────────

export interface NormalizedTracking {
  orderId: string;
  orderStatus: string;
  trackingNumber?: string;
  status?: string;
  estimatedDelivery?: string;
  estimatedDeliveryEnd?: string;
  labelUrl?: string;
  courierName?: string;
  courierPhone?: string;
  events: Array<{
    id?: string;
    status: string;
    note?: string;
    location?: string;
    createdAt: string;
  }>;
  actualDeliveredAt?: string;
}

export function useOrderTracking(
  id: string,
  options?: {
    /**
     * Set to true when SignalR is actively connected to this shipment.
     * Disabling polling when real-time is available avoids redundant network requests.
     */
    disablePolling?: boolean;
  },
) {
  return useQuery({
    queryKey: orderKeys.tracking(id),
    queryFn: async (): Promise<NormalizedTracking> => {
      const { data } = await api.get(`/api/orders/${id}/tracking`);
      const raw = data ?? {};
      return {
        orderId:              raw.orderId as string,
        orderStatus:          raw.orderStatus as string,
        trackingNumber:       raw.trackingNumber as string | undefined,
        status:               (raw.shipmentStatus ?? raw.status) as string | undefined,
        estimatedDelivery:    raw.estimatedDelivery as string | undefined,
        // estimatedDeliveryEnd comes from the window-based ETA; fall back to estimatedDelivery
        estimatedDeliveryEnd: (raw.estimatedDeliveryEnd ?? raw.estimatedDelivery) as string | undefined,
        labelUrl:             raw.labelUrl as string | undefined,
        courierName:          raw.courierName as string | undefined,
        courierPhone:         raw.courierPhone as string | undefined,
        events:               (raw.history ?? raw.events ?? []) as NormalizedTracking["events"],
        actualDeliveredAt:    raw.actualDeliveredAt as string | undefined,
      };
    },
    enabled: !!id,
    // Polling fallback when SignalR is not connected.
    // Components can pass disablePolling=true when they have an active SignalR connection
    // to avoid wasteful double-fetching.
    refetchInterval: options?.disablePolling ? false : 30_000,
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

    // Optimistic: flip the status to CANCELLED immediately so the list updates
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.myOrders() });
      const snapshots = queryClient.getQueriesData<Order[]>({
        queryKey: orderKeys.myOrders(),
      });
      queryClient.setQueriesData<Order[]>(
        { queryKey: orderKeys.myOrders() },
        (old) =>
          old?.map((o) =>
            o.id === orderId ? { ...o, status: "CANCELLED" as OrderStatus } : o,
          ),
      );
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _err, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    },
  });
}

// ── Merchant Hooks ────────────────────────────────────────────────────────────

interface MerchantIncomingOrdersResponse {
  orders: Order[];
  total: number;
  stats: { total: number; pending: number; processing: number; delivered: number };
}

export function useMerchantIncomingOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: orderKeys.merchantIncoming(status),
    queryFn: async (): Promise<MerchantIncomingOrdersResponse> => {
      const params = status ? `?status=${status}` : "";
      const { data } = await api.get<
        PaginatedOrdersResponse & { stats?: MerchantIncomingOrdersResponse["stats"] }
      >(`/api/orders/merchant/incoming${params}`);
      if (!Array.isArray(data?.data)) {
        throw new Error(
          `Unexpected merchant orders response shape: ${JSON.stringify(data).slice(0, 200)}`,
        );
      }
      return {
        orders: data.data,
        total: data.pagination?.total ?? data.data.length,
        stats: data.stats ?? { total: 0, pending: 0, processing: 0, delivered: 0 },
      };
    },
  });
}

export function usePackOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.patch(`/api/orders/${orderId}/pack`),

    // Optimistic: order card immediately shows "Label Generated" status
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.merchantIncoming() });
      const snapshots = queryClient.getQueriesData<Order[]>({
        queryKey: orderKeys.merchantIncoming(),
      });
      queryClient.setQueriesData<Order[]>(
        { queryKey: orderKeys.merchantIncoming() },
        (old) =>
          old?.map((o) =>
            o.id === orderId
              ? { ...o, status: "LABEL_GENERATED" as OrderStatus }
              : o,
          ),
      );
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _err, orderId) => {
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
      if (filters?.page)       params.set("page",       String(filters.page));
      if (filters?.limit)      params.set("limit",      String(filters.limit));
      if (filters?.status)     params.set("status",     filters.status);
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      const { data } = await api.get<PaginatedOrdersBackend>(
        `/api/orders/admin/all?${params}`,
      );
      if (data.data !== undefined) {
        return {
          items:      data.data,
          totalCount: data.pagination?.total ?? 0,
          page:       data.pagination?.page  ?? 1,
          limit:      data.pagination?.limit ?? 20,
        } as PaginatedOrders;
      }
      return data as unknown as PaginatedOrders;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.adminAll() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.tracking(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    },
  });
}

// ── Public Tracking (unauthenticated QR-code access) ─────────────────────────

export function usePublicTracking(trackingNo: string) {
  return useQuery({
    queryKey: ["tracking", "public", trackingNo],
    queryFn: async () => {
      const { data } = await api.get(`/api/fulfillment/events/${trackingNo}`);
      return data;
    },
    enabled: !!trackingNo,
    refetchInterval: 60_000, // 1-minute polling fallback
  });
}
