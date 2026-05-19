"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WishlistProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  stock: number;
  category: string | null;
  merchant: { storeName: string; slug: string };
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
  all:   ["wishlist"] as const,
  list:  ()               => [...wishlistKeys.all, "list"]  as const,
  check: (productId: string) => [...wishlistKeys.all, "check", productId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: wishlistKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<WishlistResponse>("/api/wishlist");
      return data;
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
  });
}

export function useWishlistCheck(productId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: wishlistKeys.check(productId),
    queryFn: async () => {
      const { data } = await api.get<{ productId: string; inWishlist: boolean }>(
        `/api/wishlist/check/${productId}`,
      );
      return data;
    },
    enabled: !!user && !!productId,
    staleTime: 60_000,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.post(`/api/wishlist/${productId}`, {}),

    // Optimistic: mark the check-cache as "in wishlist" immediately
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.check(productId) });
      const prevCheck = queryClient.getQueryData<{ inWishlist: boolean }>(
        wishlistKeys.check(productId),
      );
      queryClient.setQueryData(wishlistKeys.check(productId), {
        productId,
        inWishlist: true,
      });
      return { prevCheck };
    },
    onError: (_err, productId, ctx) => {
      queryClient.setQueryData(wishlistKeys.check(productId), ctx?.prevCheck);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.delete(`/api/wishlist/${productId}`),

    // Optimistic: remove the item from the list and flip the check flag
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.list() });
      await queryClient.cancelQueries({ queryKey: wishlistKeys.check(productId) });

      const prevList  = queryClient.getQueryData<WishlistResponse>(wishlistKeys.list());
      const prevCheck = queryClient.getQueryData<{ inWishlist: boolean }>(
        wishlistKeys.check(productId),
      );

      // Remove from list cache
      queryClient.setQueryData<WishlistResponse>(wishlistKeys.list(), (old) =>
        old
          ? {
              ...old,
              items: old.items.filter((i) => i.productId !== productId),
              total: Math.max(0, old.total - 1),
            }
          : old,
      );

      // Flip check flag
      queryClient.setQueryData(wishlistKeys.check(productId), {
        productId,
        inWishlist: false,
      });

      return { prevList, prevCheck };
    },
    onError: (_err, productId, ctx) => {
      queryClient.setQueryData(wishlistKeys.list(),           ctx?.prevList);
      queryClient.setQueryData(wishlistKeys.check(productId), ctx?.prevCheck);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/api/wishlist"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.list() });
      const prev = queryClient.getQueryData<WishlistResponse>(wishlistKeys.list());
      queryClient.setQueryData<WishlistResponse>(wishlistKeys.list(), {
        total: 0,
        items: [],
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(wishlistKeys.list(), ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
