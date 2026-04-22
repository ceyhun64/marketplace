import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  offerId: string;
  productId: string;
  productName: string;
  productImage?: string; // opsiyonel
  price: number;
  quantity: number;
  merchantId: string;
  merchantStoreName?: string; // opsiyonel
  stock?: number; // opsiyonel
  source?: string; // opsiyonel
  merchantSlug?: string; // opsiyonel
}

export type ShippingRate = "EXPRESS" | "REGULAR";

interface CartState {
  items: CartItem[];
  shippingRate: ShippingRate;

  // ── Computed ───────────────────────────────────────────────────────────────
  totalItems: () => number;
  subtotal: () => number;
  shippingCost: () => number;
  total: () => number;

  // ── Actions ────────────────────────────────────────────────────────────────
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (offerId: string) => void;
  updateQuantity: (offerId: string, quantity: number) => void;
  setShippingRate: (rate: ShippingRate) => void;
  clearCart: () => void;
  hasItem: (offerId: string) => boolean;
  getItemQuantity: (offerId: string) => number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHIPPING_COSTS: Record<ShippingRate, number> = {
  EXPRESS: 49.9,
  REGULAR: 19.9,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingRate: "REGULAR",

      // ── Computed ─────────────────────────────────────────────────────────

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      shippingCost: () =>
        get().items.length > 0 ? SHIPPING_COSTS[get().shippingRate] : 0,

      total: () => get().subtotal() + get().shippingCost(),

      // ── Actions ──────────────────────────────────────────────────────────

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.offerId === newItem.offerId,
          );

          if (existing) {
            const nextQty = existing.quantity + 1;
            if (existing.stock !== undefined && nextQty > existing.stock)
              return state;

            return {
              items: state.items.map((i) =>
                i.offerId === newItem.offerId ? { ...i, quantity: nextQty } : i,
              ),
            };
          }

          return {
            items: [...state.items, { ...newItem, quantity: 1 }],
          };
        }),

      removeItem: (offerId) =>
        set((state) => ({
          items: state.items.filter((i) => i.offerId !== offerId),
        })),

      updateQuantity: (offerId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.offerId !== offerId) };
          }

          return {
            items: state.items.map((i) => {
              if (i.offerId !== offerId) return i;
              return {
                ...i,
                quantity:
                  i.stock !== undefined
                    ? Math.min(quantity, i.stock)
                    : quantity,
              };
            }),
          };
        }),

      setShippingRate: (rate) => set({ shippingRate: rate }),

      clearCart: () => set({ items: [], shippingRate: "REGULAR" }),

      hasItem: (offerId) => get().items.some((i) => i.offerId === offerId),

      getItemQuantity: (offerId) =>
        get().items.find((i) => i.offerId === offerId)?.quantity ?? 0,
    }),
    {
      name: "marketplace-cart",
      storage: createJSONStorage(() => sessionStorage),
      // Sadece items ve shippingRate kalıcı
      partialize: (state) => ({
        items: state.items,
        shippingRate: state.shippingRate,
      }),
    },
  ),
);

// ── Convenience selectors ─────────────────────────────────────────────────────

/** Sepetteki benzersiz satıcı sayısı */
export const useCartMerchantCount = () =>
  useCart((s) => new Set(s.items.map((i) => i.merchantId)).size);

/** Sepet özeti: ürün adedi, toplam fiyat */
export const useCartSummary = () =>
  useCart((s) => ({
    itemCount: s.totalItems(),
    subtotal: s.subtotal(),
    shipping: s.shippingCost(),
    total: s.total(),
    shippingRate: s.shippingRate,
    isEmpty: s.items.length === 0,
  }));
