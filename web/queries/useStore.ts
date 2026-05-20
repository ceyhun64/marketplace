"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { STALE_TIME } from "@/lib/constants";
import type { MerchantProfile, Product } from "@/types/entities";
import type {
  PagedResponse,
  UpdateStoreSettingsRequest,
  SetDomainRequest,
  ProductFilters,
} from "@/types/api";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const storeKeys = {
  all: ["stores"] as const,
  list: () => [...storeKeys.all, "list"] as const,
  detail: (slug: string) => [...storeKeys.all, "detail", slug] as const,
  products: (slug: string, filters?: ProductFilters) =>
    [...storeKeys.all, "products", slug, filters] as const,
  categories: (slug: string) => [...storeKeys.all, "categories", slug] as const,
  featured: () => [...storeKeys.all, "featured"] as const,
};

// ── Public Store Hooks ────────────────────────────────────────────────────────

/**
 * E-store profile — fetched by slug.
 * Used by the /store/[slug] page.
 */
export function useStore(slug: string) {
  return useQuery({
    queryKey: storeKeys.detail(slug),
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile>(`/api/store/${slug}`);
      return data;
    },
    enabled: !!slug,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * E-store products — those with publishToStore=true.
 */
export function useStoreProducts(slug: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: storeKeys.products(slug, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.category) params.set("category", filters.category);
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
      if (filters.sort) params.set("sort", filters.sort);

      const { data } = await api.get<PagedResponse<Product>>(
        `/api/store/${slug}/products?${params}`,
      );
      return data;
    },
    enabled: !!slug,
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * A single product from the e-store.
 */
export function useStoreProduct(slug: string, productId: string) {
  return useQuery({
    queryKey: [...storeKeys.products(slug), productId],
    queryFn: async () => {
      const { data } = await api.get<Product>(
        `/api/store/${slug}/products/${productId}`,
      );
      return data;
    },
    enabled: !!slug && !!productId,
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Categories within the store.
 */
export function useStoreCategories(slug: string) {
  return useQuery({
    queryKey: storeKeys.categories(slug),
    queryFn: async () => {
      const { data } = await api.get(`/api/store/${slug}/categories`);
      return data;
    },
    enabled: !!slug,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Full e-store listing — for the "Featured Stores" section on the home page.
 */
export function useStoreList(limit?: number) {
  return useQuery({
    queryKey: [...storeKeys.list(), limit],
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : "";
      const { data } = await api.get<unknown>(`/api/store/list${params}`);
      // API returns { total, page, limit, stores: [...] }
      if (Array.isArray(data)) return data as MerchantProfile[];
      const paged = data as {
        stores?: MerchantProfile[];
        items?: MerchantProfile[];
        data?: MerchantProfile[];
      };
      return (paged.stores ??
        paged.items ??
        paged.data ??
        []) as MerchantProfile[];
    },
    staleTime: STALE_TIME.LONG,
  });
}

// ── Merchant Store Settings ───────────────────────────────────────────────────

/**
 * Merchant updates their own store settings.
 */
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStoreSettingsRequest) =>
      api.put("/api/store/settings", body),
    onSuccess: () => {
      // Invalidate merchant profile and store cache
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

/**
 * Assign a custom domain / subdomain.
 */
export function useSetStoreDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SetDomainRequest) =>
      api.post("/api/store/domain/set", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

/**
 * Initiate DNS verification.
 */
export function useVerifyDomain() {
  return useMutation({
    mutationFn: () => api.post("/api/store/domain/verify"),
  });
}

// ── Admin: Set Up Store on Behalf of Merchant ────────────────────────────────

export function useAdminSetupStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      merchantId,
      ...body
    }: {
      merchantId: string;
      storeName: string;
      slug: string;
      latitude: number;
      longitude: number;
    }) => api.post(`/api/admin/store/${merchantId}/setup`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}
