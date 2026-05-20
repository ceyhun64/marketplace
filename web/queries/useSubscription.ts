"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { STALE_TIME } from "@/lib/constants";
import type {
  Subscription,
  Invoice,
  Plugin,
  MerchantPlugin,
} from "@/types/entities";
import type { PagedResponse } from "@/types/api";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  myPlan: () => [...subscriptionKeys.all, "my-plan"] as const,
  adminList: () => [...subscriptionKeys.all, "admin", "list"] as const,
};

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (filters?: object) => [...invoiceKeys.all, "list", filters] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
  adminAll: (filters?: object) =>
    [...invoiceKeys.all, "admin", filters] as const,
};

export const pluginKeys = {
  all: ["plugins"] as const,
  list: () => [...pluginKeys.all, "list"] as const,
  myPlugins: () => [...pluginKeys.all, "my"] as const,
};

// ── Subscription Hooks ────────────────────────────────────────────────────────

/**
 * The merchant's active subscription plan.
 */
export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionKeys.myPlan(),
    queryFn: async () => {
      const { data } = await api.get<Subscription>("/api/subscriptions/my");
      return data;
    },
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Admin: all merchant subscriptions.
 */
export function useAdminSubscriptions() {
  return useQuery({
    queryKey: subscriptionKeys.adminList(),
    queryFn: async () => {
      const { data } = await api.get<Subscription[]>(
        "/api/subscriptions/admin/all",
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useUpgradePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: "BASIC" | "PRO" | "ENTERPRISE") =>
      api.post("/api/subscriptions/upgrade", { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.myPlan() });
    },
  });
}

// ── Invoice Hooks ─────────────────────────────────────────────────────────────

/**
 * The merchant's own invoices.
 */
export function useMyInvoices(filters?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      const { data } = await api.get<PagedResponse<Invoice>>(
        `/api/invoices?${params}`,
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/api/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Admin: all invoices (accounting).
 */
export function useAdminInvoices(filters?: {
  page?: number;
  limit?: number;
  merchantId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: invoiceKeys.adminAll(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      if (filters?.startDate) params.set("startDate", filters.startDate);
      if (filters?.endDate) params.set("endDate", filters.endDate);
      const { data } = await api.get<PagedResponse<Invoice>>(
        `/api/invoices/admin/all?${params}`,
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Returns the invoice PDF download URL (as a blob).
 */
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      // Create a Blob URL and trigger download
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return url;
    },
  });
}

// ── Plugin Hooks ──────────────────────────────────────────────────────────────

/**
 * All available plugins — plugin marketplace listing.
 */
export function usePlugins() {
  return useQuery({
    queryKey: pluginKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<any>("/api/plugins");
      // API returns GetPluginsResult { Items, Total, Page, TotalPages }
      const raw = data?.items ?? data?.Items ?? data;
      return (Array.isArray(raw) ? raw : []) as Plugin[];
    },
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * The merchant's active plugins.
 */
export function useMyPlugins() {
  return useQuery({
    queryKey: pluginKeys.myPlugins(),
    queryFn: async () => {
      const { data } = await api.get<MerchantPlugin[]>("/api/plugins/my");
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useActivatePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pluginId: string) =>
      api.post(`/api/plugins/${pluginId}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pluginKeys.myPlugins() });
    },
  });
}

export function useDeactivatePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pluginId: string) =>
      api.delete(`/api/plugins/${pluginId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pluginKeys.myPlugins() });
    },
  });
}
