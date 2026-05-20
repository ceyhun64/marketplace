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
 * Stripe PaymentIntent details.
 * client_secret → payment is completed using Stripe Elements.
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
 * Creates a Stripe PaymentIntent for an order.
 * First create the order via /api/orders, then initiate payment with this hook.
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
 * Stripe payment confirmation.
 * Called after Stripe.js confirmCardPayment() succeeds.
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

/** Admin: process a refund */
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

/** Query payment status */
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
