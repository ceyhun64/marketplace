"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ShippingRate, OrderSource } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  shippingRate: ShippingRate;
  source: OrderSource;
}

export interface CheckoutResponse {
  orderId: string;
  /** iyzico ödeme formu HTML'i (checkoutFormContent) */
  checkoutFormContent: string;
  /** iyzico token */
  token: string;
  /** iyzico callback URL'i */
  paymentPageUrl?: string;
}

export interface RefundRequest {
  paymentId: string;
  reason?: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Ödeme başlat — iyzico 3DS checkout form'unu döner.
 * `checkoutFormContent` bir `<script>` tag'i içerir, bunu DOM'a inject etmek
 * için PaymentForm component'ini kullan.
 */
export function useCheckout() {
  return useMutation({
    mutationFn: async (body: CheckoutRequest) => {
      const { data } = await api.post<CheckoutResponse>(
        "/api/payments/checkout",
        body,
      );
      return data;
    },
  });
}

/** Admin: iade işlemi */
export function useRefund() {
  return useMutation({
    mutationFn: async ({ paymentId, reason }: RefundRequest) => {
      const { data } = await api.post(`/api/payments/${paymentId}/refund`, {
        reason,
      });
      return data;
    },
  });
}
