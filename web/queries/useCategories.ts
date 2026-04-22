"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { STALE_TIME } from "@/lib/constants";
import type { Category } from "@/types/entities";
import type { CreateCategoryRequest } from "@/types/api";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
  detail: (slug: string) => [...categoryKeys.all, "detail", slug] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Tüm kategori ağacını getirir (ana + alt kategoriler dahil).
 * Navbar, CategoryGrid ve filtre dropdown'larında kullanılır.
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/api/categories");
      return data;
    },
    staleTime: STALE_TIME.LONG, // Kategoriler sık değişmez
  });
}

/**
 * Tek kategori + o kategoriye ait ürünleri getirir.
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: async () => {
      const { data } = await api.get<Category>(`/api/categories/${slug}`);
      return data;
    },
    enabled: !!slug,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Sadece ana kategoriler (parentId yoklar) — navigasyon için.
 */
export function useRootCategories() {
  return useQuery({
    queryKey: [...categoryKeys.list(), "root"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/api/categories");
      return data.filter((c) => !c.parentId);
    },
    staleTime: STALE_TIME.LONG,
  });
}

// ── Admin Mutations ────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryRequest) =>
      api.post<Category>("/api/categories", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & Partial<CreateCategoryRequest>) =>
      api.put<Category>(`/api/categories/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
  });
}
