"use client";

import { create } from "zustand";
import type { ShippingAddress } from "@/types/entities";
import type { ShippingRate } from "@/types/enums";
import type { EtaResult } from "@/lib/shipping";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CheckoutStep =
  | "cart"
  | "address"
  | "shipping"
  | "payment"
  | "confirmation";

interface CheckoutState {
  step: CheckoutStep;
  shippingAddress: ShippingAddress | null;
  shippingRate: ShippingRate;
  eta: EtaResult | null;
  orderId: string | null;
  paymentToken: string | null;
  isSubmitting: boolean;
  error: string | null;

  // Applied coupon (set from CartPage, consumed by CheckoutPage)
  appliedCouponCode: string | null;
  appliedCouponDiscount: number;

  // ── Actions ────────────────────────────────────────────────────────────────
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setShippingAddress: (address: ShippingAddress) => void;
  setShippingRate: (rate: ShippingRate) => void;
  setEta: (eta: EtaResult | null) => void;
  setOrderResult: (orderId: string, paymentToken: string) => void;
  setSubmitting: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setAppliedCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
  reset: () => void;
}

// ── Step Order ────────────────────────────────────────────────────────────────

const STEPS: CheckoutStep[] = [
  "cart",
  "address",
  "shipping",
  "payment",
  "confirmation",
];

function nextStepOf(current: CheckoutStep): CheckoutStep {
  const idx = STEPS.indexOf(current);
  return idx < STEPS.length - 1 ? STEPS[idx + 1] : current;
}

function prevStepOf(current: CheckoutStep): CheckoutStep {
  const idx = STEPS.indexOf(current);
  return idx > 0 ? STEPS[idx - 1] : current;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCheckout = create<CheckoutState>((set, get) => ({
  step: "cart",
  shippingAddress: null,
  shippingRate: "REGULAR",
  eta: null,
  orderId: null,
  paymentToken: null,
  isSubmitting: false,
  error: null,
  appliedCouponCode: null,
  appliedCouponDiscount: 0,

  setStep: (step) => set({ step }),
  nextStep: () => set({ step: nextStepOf(get().step) }),
  prevStep: () => set({ step: prevStepOf(get().step) }),

  setShippingAddress: (address) => set({ shippingAddress: address }),
  setShippingRate: (rate) => set({ shippingRate: rate }),
  setEta: (eta) => set({ eta }),

  setOrderResult: (orderId, paymentToken) => set({ orderId, paymentToken }),

  setSubmitting: (v) => set({ isSubmitting: v }),
  setError: (msg) => set({ error: msg }),

  setAppliedCoupon: (code, discount) =>
    set({ appliedCouponCode: code, appliedCouponDiscount: discount }),
  clearCoupon: () =>
    set({ appliedCouponCode: null, appliedCouponDiscount: 0 }),

  reset: () =>
    set({
      step: "cart",
      shippingAddress: null,
      shippingRate: "REGULAR",
      eta: null,
      orderId: null,
      paymentToken: null,
      isSubmitting: false,
      error: null,
      appliedCouponCode: null,
      appliedCouponDiscount: 0,
    }),
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

/** Checkout adım progress'ini 0-100 arasında döndürür */
export const useCheckoutProgress = () =>
  useCheckout((s) => {
    const idx = STEPS.indexOf(s.step);
    return Math.round(((idx + 1) / STEPS.length) * 100);
  });

/** Şu an hangi adımda olduğunu döndürür */
export const useCheckoutStep = () => useCheckout((s) => s.step);

/** Adresin dolu olup olmadığı */
export const useHasShippingAddress = () =>
  useCheckout((s) => !!s.shippingAddress);
