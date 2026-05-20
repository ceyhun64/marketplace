"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { MerchantProfile, Product, Order, User } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminOverviewStats {
  totalGmv: number;
  totalMerchants: number;
  totalOrders: number;
  totalCustomers: number;
  fulfillmentSuccessRate: number;
  averageDeliveryHours: number;
  pendingProductApprovals: number;
  activeCourierCount: number;
  todayOrderCount: number;
  // Backward-compat aliases
  totalRevenue?: number;
  pendingApprovals?: number;
  activeShipments?: number;
  totalProducts?: number;
}

export interface AdminRevenueReport {
  period: string;
  rows: {
    merchantId: string;
    storeName: string;
    revenue: number;
    orderCount: number;
  }[];
  chartData: {
    date: string;
    revenue: number;
    orderCount: number;
    label: string;
  }[];
  // Backward-compat
  byMerchant?: {
    merchantId: string;
    storeName: string;
    revenue: number;
    orders: number;
  }[];
}

export interface FulfillmentPerformance {
  averageDeliveryHours: number;
  successRate: number;
  failedCount: number;
  totalDelivered: number;
  totalShipments: number;
  delayRate: number;
  activeCourierCount: number;
  pendingAssignCount: number;
  courierPerformance: {
    courierId: string;
    courierName: string;
    deliveredCount: number;
    averageDeliveryHours: number;
  }[];
  // Backward-compat alias
  byCourier?: {
    courierId: string;
    fullName: string;
    deliveries: number;
    successRate: number;
    avgHours: number;
  }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  merchants: (filters?: object) =>
    [...adminKeys.all, "merchants", filters] as const,
  merchant: (id: string) => [...adminKeys.all, "merchant", id] as const,
  orders: (filters?: object) => [...adminKeys.all, "orders", filters] as const,
  pendingProducts: (filters?: object) =>
    [...adminKeys.all, "pendingProducts", filters] as const,
  users: (filters?: object) => [...adminKeys.all, "users", filters] as const,
  overview: () => [...adminKeys.all, "overview"] as const,
  revenue: (period?: string) => [...adminKeys.all, "revenue", period] as const,
  fulfillmentPerf: () => [...adminKeys.all, "fulfillmentPerf"] as const,
};

// ── Merchant Management ───────────────────────────────────────────────────────

export function useAdminMerchants(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  isSuspended?: boolean;
}) {
  return useQuery({
    queryKey: adminKeys.merchants(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.search) params.set("search", filters.search);
      // API expects isActive (the inverse of isSuspended)
      if (filters?.isSuspended !== undefined)
        params.set("isActive", String(!filters.isSuspended));
      const { data } = await api.get<PaginatedResponse<MerchantProfile>>(
        `/api/admin/merchants?${params}`,
      );
      // API returns { total, page, limit, items } → normalize
      const raw = data as any;
      if (raw.total !== undefined && raw.totalCount === undefined) {
        return {
          items: raw.items ?? [],
          totalCount: raw.total,
          page: raw.page ?? 1,
          limit: raw.limit ?? 20,
        } as PaginatedResponse<MerchantProfile>;
      }
      return data;
    },
  });
}

export function useAdminMerchant(id: string) {
  return useQuery({
    queryKey: adminKeys.merchant(id),
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile>(
        `/api/admin/merchants/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useSuspendMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      merchantId,
      suspend,
    }: {
      merchantId: string;
      suspend: boolean;
    }) => api.patch(`/api/admin/merchants/${merchantId}/suspend`, { suspend }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.merchants() });
    },
  });
}

export function useAdminSetupStore() {
  return useMutation({
    mutationFn: ({
      merchantId,
      body,
    }: {
      merchantId: string;
      body: {
        storeName: string;
        slug: string;
        description?: string;
        logoUrl?: string;
      };
    }) => api.post(`/api/admin/store/${merchantId}/setup`, body),
  });
}

// ── Order Management ──────────────────────────────────────────────────────────

export function useAdminOrders(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  merchantId?: string;
}) {
  return useQuery({
    queryKey: adminKeys.orders(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.status) params.set("status", filters.status);
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      const { data } = await api.get<PaginatedResponse<Order>>(
        `/api/orders/admin/all?${params}`,
      );
      // API returns { data: orders[], pagination: { page, limit, total, pages } }
      const raw = data as any;
      if (raw?.pagination !== undefined) {
        return {
          items: raw.data ?? [],
          totalCount: raw.pagination?.total ?? 0,
          page: raw.pagination?.page ?? 1,
          limit: raw.pagination?.limit ?? 20,
        } as PaginatedResponse<Order>;
      }
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders() });
    },
  });
}

// ── Product Approval ──────────────────────────────────────────────────────────

export function useAdminPendingProducts(filters?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.pendingProducts(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      const { data } = await api.get<PaginatedResponse<Product>>(
        `/api/products/pending?${params}`,
      );
      return data;
    },
  });
}

export function useApproveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.patch(`/api/products/${productId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingProducts() });
    },
  });
}

export function useRejectProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      reason,
    }: {
      productId: string;
      reason?: string;
    }) => api.patch(`/api/products/${productId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingProducts() });
    },
  });
}

// ── Admin Analytics ───────────────────────────────────────────────────────────

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: async () => {
      const { data } = await api.get<AdminOverviewStats>(
        "/api/analytics/admin/overview",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminRevenue(
  period: "daily" | "weekly" | "monthly" = "monthly",
) {
  return useQuery({
    queryKey: adminKeys.revenue(period),
    queryFn: async () => {
      const { data } = await api.get<AdminRevenueReport>(
        `/api/analytics/admin/revenue?period=${period}`,
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminFulfillmentPerformance() {
  return useQuery({
    queryKey: adminKeys.fulfillmentPerf(),
    queryFn: async () => {
      const { data } = await api.get<FulfillmentPerformance>(
        "/api/analytics/admin/fulfillment",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── User Management ───────────────────────────────────────────────────────────

export function useAdminUsers(filters?: {
  page?: number;
  limit?: number;
  role?: string;
}) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.role) params.set("role", filters.role);
      const { data } = await api.get<PaginatedResponse<User>>(
        `/api/admin/users?${params}`,
      );
      // API returns { total, page, limit, items }
      const raw = data as any;
      if (raw?.total !== undefined && raw?.totalCount === undefined) {
        return {
          items: raw.items ?? [],
          totalCount: raw.total,
          page: raw.page ?? 1,
          limit: raw.limit ?? 20,
        } as PaginatedResponse<User>;
      }
      return data;
    },
  });
}
