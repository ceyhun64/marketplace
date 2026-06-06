/**
 * use-hybrid-wishlist.ts
 *
 * Giriş yapmamış kullanıcı → localStorage
 * Giriş yapmış kullanıcı    → API
 *
 * İkisi arasındaki geçiş syncGuestWishlistToServer() ile yapılır.
 */

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocalWishlist } from "@/hooks/use-wishlist-local";
import { wishlistKeys } from "@/queries/useWishlist";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WishlistItemMeta {
  productName?: string;
  productImage?: string;
  price?: number;
}

// ── Ana Hook ─────────────────────────────────────────────────────────────────

export function useHybridWishlist() {
  const { user } = useAuth();
  const local = useLocalWishlist();
  const queryClient = useQueryClient();

  const isLoggedIn = !!user;

  // ── Ürün favoride mi? ─────────────────────────────────────────────────────

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      if (!isLoggedIn) {
        return local.hasItem(productId);
      }
      // Sunucu verisi React Query cache'inden okunur
      const cached = queryClient.getQueryData<{ inWishlist: boolean }>(
        wishlistKeys.check(productId),
      );
      return cached?.inWishlist ?? false;
    },
    [isLoggedIn, local, queryClient],
  );

  // ── Toggle ────────────────────────────────────────────────────────────────

  const toggle = useCallback(
    async (
      productId: string,
      meta: WishlistItemMeta = {},
    ): Promise<boolean> => {
      // Guest akışı: tamamen local
      if (!isLoggedIn) {
        if (local.hasItem(productId)) {
          local.removeItem(productId);
          return false; // artık favoride değil
        } else {
          local.addItem({
            productId,
            productName: meta.productName ?? "",
            productImage: meta.productImage,
            price: meta.price,
          });
          return true; // favoriye eklendi
        }
      }

      // Kayıtlı kullanıcı akışı: API
      const cached = queryClient.getQueryData<{ inWishlist: boolean }>(
        wishlistKeys.check(productId),
      );
      const currentlyIn = cached?.inWishlist ?? false;

      // Optimistic update
      queryClient.setQueryData(wishlistKeys.check(productId), {
        productId,
        inWishlist: !currentlyIn,
      });

      try {
        if (currentlyIn) {
          await api.delete(`/api/wishlist/${productId}`);
        } else {
          await api.post(`/api/wishlist/${productId}`);
        }

        // İstek listesi genel cache'ini geçersiz kıl
        await queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
        return !currentlyIn;
      } catch (err) {
        // Rollback
        queryClient.setQueryData(wishlistKeys.check(productId), {
          productId,
          inWishlist: currentlyIn,
        });
        throw err;
      }
    },
    [isLoggedIn, local, queryClient],
  );

  return {
    isInWishlist,
    toggle,
    guestCount: local.count(),
    isLoggedIn,
  };
}

// ── Giriş sonrası senkronizasyon ──────────────────────────────────────────────

/**
 * Kullanıcı giriş yaptıktan sonra çağrılır.
 * Lokalde biriken favori ürünleri API'ye toplu olarak gönderir.
 */
export async function syncGuestWishlistToServer(): Promise<void> {
  const localItems = useLocalWishlist.getState().items;
  if (localItems.length === 0) return;

  // Sunucuda hangilerinin zaten var olduğunu bilmiyoruz,
  // her birini POST et — backend idempotent olmalı (409 dön ya da upsert yap).
  const results = await Promise.allSettled(
    localItems.map((item) =>
      api.post(`/api/wishlist/${item.productId}`),
    ),
  );

  // Başarılı olanları local'dan temizle
  const failedIds = new Set<string>();
  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      const status = (result.reason as { response?: { status?: number } })
        ?.response?.status;
      // 409 Conflict = zaten var → başarılı say
      if (status !== 409) {
        failedIds.add(localItems[idx].productId);
      }
    }
  });

  // Başarıyla aktarılanları local'dan sil
  localItems
    .filter((item) => !failedIds.has(item.productId))
    .forEach((item) => useLocalWishlist.getState().removeItem(item.productId));
}
