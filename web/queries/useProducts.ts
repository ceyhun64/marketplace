"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Product } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductsResponse {
  items: Product[];
  totalCount: number;
  page: number;
  limit: number;
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

// ── Query Keys ────────────────────────────────────────────────────────────────

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  featured: (limit?: number) =>
    [...productKeys.all, "featured", limit] as const,
  search: (q: string, filters?: ProductFilters) =>
    [...productKeys.all, "search", q, filters] as const,
  merchantProducts: (filters?: ProductFilters) =>
    [...productKeys.all, "merchant", filters] as const,
  storeProducts: (slug: string, filters?: ProductFilters) =>
    [...productKeys.all, "store", slug, filters] as const,
  pending: (filters?: object) =>
    [...productKeys.all, "pending", filters] as const,
};

// ── Public / Marketplace Hooks ────────────────────────────────────────────────

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.category) params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.tags?.length)
        filters.tags.forEach((t) => params.append("tags[]", t));
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
      if (filters.sort) params.set("sort", filters.sort);
      const { data } = await api.get<ProductsResponse>(
        `/api/products?${params}`,
      );
      return data;
    },
    staleTime: 1000 * 60,
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
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        `/api/products/featured?limit=${limit}`,
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchProducts(q: string, filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.search(q, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ q });
      if (filters?.category) params.set("category", filters.category);
      if (filters?.subcategory) params.set("subcategory", filters.subcategory);
      if (filters?.tags?.length)
        filters.tags.forEach((t) => params.append("tags[]", t));
      const { data } = await api.get<ProductsResponse>(
        `/api/products/search?${params}`,
      );
      return data;
    },
    enabled: q.trim().length > 1,
    staleTime: 1000 * 30,
  });
}

// ── Store Hooks ───────────────────────────────────────────────────────────────

export function useStoreProducts(slug: string, filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.storeProducts(slug, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.category) params.set("category", filters.category);
      if (filters?.search) params.set("search", filters.search);
      const { data } = await api.get<ProductsResponse>(
        `/api/store/${slug}/products?${params}`,
      );
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60,
  });
}

export function useStoreProduct(slug: string, productId: string) {
  return useQuery({
    queryKey: [...productKeys.storeProducts(slug), "detail", productId],
    queryFn: async () => {
      const { data } = await api.get<Product>(
        `/api/store/${slug}/products/${productId}`,
      );
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
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.search) params.set("search", filters.search);
      const { data } = await api.get<ProductsResponse>(
        `/api/products/merchant?${params}`,
      );
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductDto) =>
      api.post<Product>("/api/products", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.merchantProducts(),
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<CreateProductDto>) =>
      api.put<Product>(`/api/products/${id}`, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: productKeys.merchantProducts(),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.merchantProducts(),
      });
    },
  });
}

/** publishToMarket / publishToStore toggle */
export function useTogglePublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & PublishToggleDto) =>
      api.patch(`/api/products/${id}/publish`, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: productKeys.merchantProducts(),
      });
    },
  });
}
