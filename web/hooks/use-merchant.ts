"use client";

import { create } from "zustand";
import { useAuth } from "./use-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Merchant panel içindeki aktif sekme / görünüm */
export type MerchantView =
  | "catalogue"
  | "orders"
  | "analytics"
  | "store-settings"
  | "invoices"
  | "subscription";

interface MerchantPanelState {
  activeView: MerchantView;
  selectedProductId: string | null;
  isAddProductOpen: boolean;
  isEditProductOpen: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setActiveView: (view: MerchantView) => void;
  selectProduct: (id: string | null) => void;
  openAddProduct: () => void;
  closeAddProduct: () => void;
  openEditProduct: (id: string) => void;
  closeEditProduct: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMerchantPanel = create<MerchantPanelState>((set) => ({
  activeView: "catalogue",
  selectedProductId: null,
  isAddProductOpen: false,
  isEditProductOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  selectProduct: (id) => set({ selectedProductId: id }),

  openAddProduct: () => set({ isAddProductOpen: true }),
  closeAddProduct: () => set({ isAddProductOpen: false }),

  openEditProduct: (id) =>
    set({ selectedProductId: id, isEditProductOpen: true }),
  closeEditProduct: () =>
    set({ selectedProductId: null, isEditProductOpen: false }),
}));

// ── Convenience Hook ──────────────────────────────────────────────────────────

/**
 * Mevcut kullanıcının merchant olup olmadığını ve merchantId'sini döndürür.
 */
export function useMerchantIdentity() {
  const { user } = useAuth();
  return {
    isMerchant: user?.role === "Merchant",
    merchantId: user?.merchantId ?? null,
    userId: user?.id ?? null,
  };
}
