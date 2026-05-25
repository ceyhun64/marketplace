"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Product } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductStats {
  total: number;
  onMarket: number;
  onStore: number;
  pendingApproval: number;
  outOfStock: number;
}

export interface ProductsResponse {
  items: Product[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages?: number;
  stats?: ProductStats;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  tags?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  isApproved?: boolean;
  outOfStock?: boolean;
}

export interface CreateProductDto {
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  tags: string[];
  price: number;
  stock: number;
  publishToMarket?: boolean;
  publishToStore?: boolean;
}

export interface PublishToggleDto {
  publishToMarket?: boolean;
  publishToStore?: boolean;
}

// ── Raw backend shape ─────────────────────────────────────────────────────────

interface RawProductsBackend {
  items?: Product[];
  totalCount?: number;
  total?: number;
  page?: number;
  limit?: number;
  stats?: ProductStats;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  featured: (limit?: number) => [...productKeys.all, "featured", limit] as const,
  search: (q: string, filters?: ProductFilters) =>
    [...productKeys.all, "search", q, filters] as const,
  // Without filters → ["products","merchant"] — prefix for invalidateQueries/cancelQueries
  // With filters    → ["products","merchant",{...}] — exact key for useQuery
  merchantProducts: (filters?: ProductFilters) =>
    filters !== undefined
      ? ([...productKeys.all, "merchant", filters] as const)
      : ([...productKeys.all, "merchant"] as const),
  storeProducts: (slug: string, filters?: ProductFilters) =>
    [...productKeys.all, "store", slug, filters] as const,
  pending: (filters?: object) => [...productKeys.all, "pending", filters] as const,
};

// ── Normalizer ────────────────────────────────────────────────────────────────

function normalizeProductsResponse(
  raw: RawProductsBackend,
  fallbackFilters?: ProductFilters,
): ProductsResponse {
  const totalCount = raw.totalCount ?? raw.total ?? 0;
  const limit = raw.limit ?? fallbackFilters?.limit ?? 20;
  return {
    items:      raw.items ?? [],
    totalCount,
    page:       raw.page ?? fallbackFilters?.page ?? 1,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    stats:      raw.stats,
  };
}

// ── Public / Marketplace Hooks ────────────────────────────────────────────────

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page)        params.set("page", String(filters.page));
      if (filters.limit)       params.set("limit", String(filters.limit));
      if (filters.category)    params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.tags?.length) filters.tags.forEach((t) => params.append("tags[]", t));
      if (filters.search)      params.set("search", filters.search);
      if (filters.minPrice)    params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice)    params.set("maxPrice", String(filters.maxPrice));
      if (filters.sort)        params.set("sort", filters.sort);
      const { data } = await api.get<RawProductsBackend>(`/api/products?${params}`);
      return normalizeProductsResponse(data, filters);
    },
    staleTime: 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Product>(`/api/products/${id}`);
      return data;
    },
    enabled: !!id,
    // 30 seconds — keeps price and stock reasonably fresh on the product page.
    // The authoritative price/stock check is always enforced server-side at
    // order creation (CreateOrderCommandHandler), so a brief stale window is
    // acceptable for display purposes.
    staleTime: 30_000,
    // Refetch when the user returns to the tab to catch price/stock changes.
    refetchOnWindowFocus: true,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: async () => {
      const { data } = await api.get<Product[]>(`/api/products/featured?limit=${limit}`);
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSearchProducts(q: string, filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.search(q, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ q });
      if (filters?.category)    params.set("category", filters.category);
      if (filters?.subcategory) params.set("subcategory", filters.subcategory);
      if (filters?.tags?.length) filters.tags!.forEach((t) => params.append("tags[]", t));
      const { data } = await api.get<RawProductsBackend>(`/api/products/search?${params}`);
      return normalizeProductsResponse(data, filters);
    },
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  });
}

// ── Store Hooks ───────────────────────────────────────────────────────────────

export function useStoreProducts(slug: string, filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.storeProducts(slug, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page)   params.set("page", String(filters.page));
      if (filters?.limit)  params.set("limit", String(filters.limit));
      if (filters?.category) params.set("category", filters.category);
      if (filters?.search) params.set("search", filters.search);
      const { data } = await api.get<ProductsResponse>(`/api/store/${slug}/products?${params}`);
      return data;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useStoreProduct(slug: string, productId: string) {
  return useQuery({
    queryKey: [...productKeys.storeProducts(slug), "detail", productId],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/api/store/${slug}/products/${productId}`);
      return data;
    },
    enabled: !!slug && !!productId,
  });
}

// ── Merchant Hooks ────────────────────────────────────────────────────────────

export function useMerchantProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.merchantProducts(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page)                   params.set("page", String(filters.page));
      if (filters?.limit)                  params.set("limit", String(filters.limit));
      if (filters?.search)                 params.set("search", filters.search);
      if (filters?.sort)                   params.set("sort", filters.sort);
      if (filters?.isApproved !== undefined) params.set("isApproved", String(filters.isApproved));
      if (filters?.outOfStock !== undefined) params.set("outOfStock", String(filters.outOfStock));
      const { data } = await api.get<RawProductsBackend>(`/api/merchants/catalogue?${params}`);
      return normalizeProductsResponse(data, filters);
    },
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductDto) =>
      api.post<Product>("/api/merchants/catalogue", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<CreateProductDto>) =>
      api.put<Product>(`/api/merchants/catalogue/${id}`, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/merchants/catalogue/${id}`),
    // Optimistic remove: product disappears immediately from the list
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: productKeys.merchantProducts() });
      const snapshots = queryClient.getQueriesData<ProductsResponse>({
        queryKey: productKeys.merchantProducts(),
      });
      queryClient.setQueriesData<ProductsResponse>(
        { queryKey: productKeys.merchantProducts() },
        (old) =>
          old
            ? { ...old, items: old.items.filter((p) => p.id !== id), totalCount: Math.max(0, old.totalCount - 1) }
            : old,
      );
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
    },
  });
}

/**
 * Optimistic publish toggle — the toggle switch flips immediately, giving
 * instant tactile feedback before the server confirms.
 */
export function useTogglePublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & PublishToggleDto) =>
      api.patch(`/api/merchants/catalogue/${id}/publish`, dto),

    onMutate: async ({ id, publishToMarket, publishToStore }) => {
      // Cancel in-flight queries so they don't overwrite the optimistic state
      await queryClient.cancelQueries({ queryKey: productKeys.merchantProducts() });

      // Snapshot all matching cache entries for rollback
      const snapshots = queryClient.getQueriesData<ProductsResponse>({
        queryKey: productKeys.merchantProducts(),
      });

      // Flip the toggle in every merchant product list cache entry
      queryClient.setQueriesData<ProductsResponse>(
        { queryKey: productKeys.merchantProducts() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((p) =>
              p.id === id
                ? {
                    ...p,
                    publishToMarket: publishToMarket ?? p.publishToMarket,
                    publishToStore:  publishToStore  ?? p.publishToStore,
                  }
                : p,
            ),
          };
        },
      );

      return { snapshots };
    },

    onError: (_err, _vars, ctx) => {
      // Rollback every affected cache entry
      ctx?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onSettled: (_data, _err, { id }) => {
      // Sync with server truth after the mutation resolves (success or error)
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
    },
  });
}

export function useProductTags() {
  return useQuery({
    queryKey: [...productKeys.all, "tags"] as const,
    queryFn: async () => {
      const { data } = await api.get<string[]>("/api/products/tags");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });
}
