"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WishlistProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  stock: number;
  category: string | null;
  merchant: {
    storeName: string;
    slug: string;
  };
}

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

export interface WishlistResponse {
  total: number;
  items: WishlistItem[];
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const wishlistKeys = {
  all: ["wishlist"] as const,
  list: () => [...wishlistKeys.all, "list"] as const,
  check: (productId: string) => [...wishlistKeys.all, "check", productId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Müşterinin istek listesini getirir */
export function useWishlist() {
  return useQuery({
    queryKey: wishlistKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<WishlistResponse>("/api/wishlist");
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/** Belirli bir ürünün istek listesinde olup olmadığını kontrol eder */
export function useWishlistCheck(productId: string) {
  return useQuery({
    queryKey: wishlistKeys.check(productId),
    queryFn: async () => {
      const { data } = await api.get<{ productId: string; inWishlist: boolean }>(
        `/api/wishlist/check/${productId}`
      );
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60,
  });
}

/** İstek listesine ürün ekler */
export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.post(`/api/wishlist/${productId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

/** İstek listesinden ürün çıkarır */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.delete(`/api/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

/** İstek listesini tamamen temizler */
export function useClearWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/api/wishlist"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
