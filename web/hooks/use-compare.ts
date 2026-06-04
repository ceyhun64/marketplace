import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CompareItem {
  id: string;
  name: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  stock: { inStock: boolean; quantity: number };
  categoryName: string;
  merchantName: string;
  merchantSlug?: string;
  merchantId?: string;
  tags: string[];
  specifications: {
    weight?: string | null;
    dimensions?: string | null;
    material?: string | null;
    warranty?: string | null;
    origin?: string | null;
  };
  shipping: {
    freeShipping: boolean;
    estimatedDelivery?: string;
  };
}

interface CompareState {
  items: CompareItem[];
  add:        (item: CompareItem) => boolean;
  remove:     (id: string)        => void;
  toggle:     (item: CompareItem) => boolean;
  isInCompare:(id: string)        => boolean;
  clear:      ()                  => void;
}

export const MAX_COMPARE = 3;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const { items } = get();
        if (items.length >= MAX_COMPARE)          return false;
        if (items.some((i) => i.id === item.id)) return true;
        set({ items: [...items, item] });
        return true;
      },

      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      toggle: (item) => {
        const { items } = get();
        if (items.some((i) => i.id === item.id)) {
          get().remove(item.id);
          return false;
        }
        return get().add(item);
      },

      isInCompare: (id) => get().items.some((i) => i.id === id),

      clear: () => set({ items: [] }),
    }),
    {
      name: "bazr_compare",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
