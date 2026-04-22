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
 * Merchant genel istatistikleri: toplam gelir, sipariş sayısı, ürün sayısı.
 */
export function useMerchantStats() {
  return useQuery({
    queryKey: analyticsKeys.merchantStats(),
    queryFn: async () => {
      const { data } = await api.get<MerchantStatsResponse>(
        "/api/analytics/merchant/stats",
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Satış grafiği verisi — günlük / haftalık / aylık.
 */
export function useMerchantSalesChart(period: AnalyticsPeriod = "weekly") {
  return useQuery({
    queryKey: analyticsKeys.merchantSales(period),
    queryFn: async () => {
      const { data } = await api.get<SalesDataPoint[]>(
        `/api/analytics/merchant/sales?period=${period}`,
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Marketplace vs E-mağaza karşılaştırma: gelir, sipariş, dönüşüm oranı.
 */
export function useMerchantComparison() {
  return useQuery({
    queryKey: analyticsKeys.merchantComparison(),
    queryFn: async () => {
      const { data } = await api.get<ComparisonData>(
        "/api/analytics/merchant/comparison",
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * En çok satan ürünler — kanal ayrımıyla.
 */
export function useMerchantTopProducts(limit = 10) {
  return useQuery({
    queryKey: analyticsKeys.merchantTopProducts(),
    queryFn: async () => {
      const { data } = await api.get<TopProduct[]>(
        `/api/analytics/merchant/top-products?limit=${limit}`,
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Tek ürünün satış detayı — marketplace vs e-mağaza kırılımıyla.
 */
export function useMerchantProductAnalytics(productId: string) {
  return useQuery({
    queryKey: analyticsKeys.merchantProduct(productId),
    queryFn: async () => {
      const { data } = await api.get(
        `/api/analytics/merchant/product/${productId}`,
      );
      return data;
    },
    enabled: !!productId,
    staleTime: STALE_TIME.MEDIUM,
  });
}

// ── Admin Analytics ───────────────────────────────────────────────────────────

/**
 * Platform geneli özet — GMV, merchant sayısı, sipariş hacmi.
 */
export function useAdminOverview() {
  return useQuery({
    queryKey: analyticsKeys.adminOverview(),
    queryFn: async () => {
      const { data } = await api.get<AdminOverviewResponse>(
        "/api/analytics/admin/overview",
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Tüm merchantlar ve mağazalar geneli gelir raporu.
 */
export function useAdminRevenue(period: AnalyticsPeriod = "monthly") {
  return useQuery({
    queryKey: analyticsKeys.adminRevenue(period),
    queryFn: async () => {
      const { data } = await api.get(
        `/api/analytics/admin/revenue?period=${period}`,
      );
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Fulfillment performans raporu — ortalama teslimat süresi, başarı oranı, kurye karnesi.
 */
export function useAdminFulfillmentStats() {
  return useQuery({
    queryKey: analyticsKeys.adminFulfillment(),
    queryFn: async () => {
      const { data } = await api.get("/api/analytics/admin/fulfillment");
      return data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}
