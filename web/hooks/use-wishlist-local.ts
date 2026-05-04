/**
 * use-wishlist-local.ts
 *
 * Giriş yapmamış kullanıcılar için localStorage tabanlı favori listesi.
 * Giriş sonrası syncWishlistToServer() ile backend'e aktarılır.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface LocalWishlistItem {
  productId: string;
  productName: string;
  productImage?: string;
  price?: number;
  addedAt: string; // ISO string
}

interface LocalWishlistState {
  items: LocalWishlistItem[];
  addItem: (item: Omit<LocalWishlistItem, "addedAt">) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearAll: () => void;
  count: () => number;
}

export const useLocalWishlist = create<LocalWishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Zaten varsa tekrar ekleme
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }
          return {
            items: [
              ...state.items,
              { ...item, addedAt: new Date().toISOString() },
            ],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      hasItem: (productId) =>
        get().items.some((i) => i.productId === productId),

      clearAll: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    {
      name: "marketplace-wishlist-guest",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
