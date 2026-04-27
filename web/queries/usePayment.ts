"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ShippingRate, OrderSource } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  orderId: string;
}

/**
 * Stripe PaymentIntent bilgileri.
 * client_secret → Stripe Elements ile ödeme tamamlanır.
 */
export interface CheckoutResponse {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentRequest {
  orderId: string;
  paymentIntentId: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Sipariş için Stripe PaymentIntent oluşturur.
 * Önce /api/orders ile sipariş oluştur, ardından bu hook ile ödeme başlat.
 */
export function useInitiateCheckout() {
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

/**
 * Stripe ödeme onayı.
 * Stripe.js confirmCardPayment() başarılı olduktan sonra çağrılır.
 */
export function useConfirmPayment() {
  return useMutation({
    mutationFn: async (body: ConfirmPaymentRequest) => {
      const { data } = await api.post<{ orderId: string; message: string }>(
        "/api/payments/confirm",
        body,
      );
      return data;
    },
  });
}

/** Admin: iade işlemi */
export function useRefund() {
  return useMutation({
    mutationFn: async ({ paymentId, amount, reason }: RefundRequest) => {
      const { data } = await api.post(`/api/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      return data;
    },
  });
}

/** Ödeme durumu sorgula */
export function usePaymentStatus(orderId: string | undefined) {
  return useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/${orderId}/status`);
      return data;
    },
    enabled: !!orderId,
    refetchInterval: 5000,
  });
}
