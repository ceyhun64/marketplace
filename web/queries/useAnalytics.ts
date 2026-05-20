"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { STALE_TIME } from "@/lib/constants";
import type {
  AnalyticsPeriod,
  MerchantStatsResponse,
  AdminOverviewResponse,
  TopProduct,
  ComparisonData,
  SalesDataPoint,
} from "@/types/api";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ["analytics"] as const,

  // Merchant
  merchantSales: (period: AnalyticsPeriod) =>
    [...analyticsKeys.all, "merchant", "sales", period] as const,
  merchantComparison: () =>
    [...analyticsKeys.all, "merchant", "comparison"] as const,
  merchantTopProducts: () =>
    [...analyticsKeys.all, "merchant", "top-products"] as const,
  merchantProduct: (productId: string) =>
    [...analyticsKeys.all, "merchant", "product", productId] as const,
  merchantStats: () => [...analyticsKeys.all, "merchant", "stats"] as const,

  // Admin
  adminOverview: () => [...analyticsKeys.all, "admin", "overview"] as const,
  adminRevenue: (period: AnalyticsPeriod) =>
    [...analyticsKeys.all, "admin", "revenue", period] as const,
  adminFulfillment: () =>
    [...analyticsKeys.all, "admin", "fulfillment"] as const,
};

// ── Merchant Analytics ────────────────────────────────────────────────────────

/**
 * Merchant general statistics: total revenue, order count, product count.
 */
export function useMerchantStats() {
  return useQuery({
    queryKey: analyticsKeys.merchantStats(),
    queryFn: async () => {
      const { data } = await api.get<any>(
        "/api/analytics/merchant/stats",
      );
      // Backend returns ApiResponse<MerchantStatsDto> → data.data or data
      return (data?.data ?? data) as MerchantStatsResponse;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Sales chart data — daily / weekly / monthly.
 */
export function useMerchantSalesChart(period: AnalyticsPeriod = "weekly") {
  return useQuery({
    queryKey: analyticsKeys.merchantSales(period),
    queryFn: async () => {
      const { data } = await api.get<any>(
        `/api/analytics/merchant/sales?period=${period}`,
      );
      // API may return an array or an object
      const raw = data?.data ?? data?.items ?? data?.salesChart ?? data?.salesByPeriod ?? data;
      return (Array.isArray(raw) ? raw : []) as SalesDataPoint[];
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Marketplace vs. e-store comparison: revenue, orders, conversion rate.
 */
export function useMerchantComparison() {
  return useQuery({
    queryKey: analyticsKeys.merchantComparison(),
    queryFn: async () => {
      const { data } = await api.get<any>("/api/analytics/merchant/comparison");
      // Backend returns ApiResponse<MarketplaceComparisonDto>
      // MarketplaceComparisonDto: { marketplace: {revenue, orders, conversionRate}, estore: {...} }
      const raw = data?.data ?? data ?? {};
      const empty = { revenue: 0, orders: 0, conversionRate: 0 };
      return {
        marketplace: raw.marketplace ?? empty,
        estore: raw.estore ?? raw.eStore ?? raw.e_store ?? empty,
      } as ComparisonData;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Best-selling products — broken down by channel.
 */
export function useMerchantTopProducts(limit = 10) {
  return useQuery({
    queryKey: analyticsKeys.merchantTopProducts(),
    queryFn: async () => {
      const { data } = await api.get<any>(
        `/api/analytics/merchant/top-products?limit=${limit}`,
      );
      // Backend returns ApiResponse<IEnumerable<TopProductDto>>
      const raw = data?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as TopProduct[];
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Sales detail for a single product — broken down by marketplace vs. e-store.
 */
export function useMerchantProductAnalytics(productId: string) {
  return useQuery({
    queryKey: analyticsKeys.merchantProduct(productId),
    queryFn: async () => {
      const { data } = await api.get<any>(
        `/api/analytics/merchant/product/${productId}`,
      );
      return data?.data ?? data;
    },
    enabled: !!productId,
    staleTime: STALE_TIME.MEDIUM,
  });
}

// ── Admin Analytics ───────────────────────────────────────────────────────────

/**
 * Platform-wide summary — GMV, merchant count, order volume.
 */
export function useAdminOverview() {
  return useQuery({
    queryKey: analyticsKeys.adminOverview(),
    queryFn: async () => {
      const { data } = await api.get<any>(
        "/api/analytics/admin/overview",
      );
      return (data?.data ?? data) as AdminOverviewResponse;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Revenue report across all merchants and stores.
 */
export function useAdminRevenue(period: AnalyticsPeriod = "monthly") {
  return useQuery({
    queryKey: analyticsKeys.adminRevenue(period),
    queryFn: async () => {
      const { data } = await api.get<any>(
        `/api/analytics/admin/revenue?period=${period}`,
      );
      return data?.data ?? data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Fulfillment performance report — average delivery time, success rate, courier scorecard.
 */
export function useAdminFulfillmentStats() {
  return useQuery({
    queryKey: analyticsKeys.adminFulfillment(),
    queryFn: async () => {
      const { data } = await api.get<any>("/api/analytics/admin/fulfillment");
      return data?.data ?? data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}
