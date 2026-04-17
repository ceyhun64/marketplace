// web/queries/useOrders.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "LABEL_GENERATED"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export interface OrderItem {
  offerId: string;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  source: "MARKETPLACE" | "ESTORE";
  totalAmount: number;
  shippingRate: "EXPRESS" | "REGULAR";
  createdAt: string;
  items: OrderItem[];
}

export interface CreateOrderDto {
  items: { offerId: string; quantity: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    postalCode: string;
  };
  shippingRate: "EXPRESS" | "REGULAR";
  source: "MARKETPLACE" | "ESTORE";
}

export const orderKeys = {
  all: ["orders"] as const,
  myOrders: (status?: string) => [...orderKeys.all, "mine", status] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  tracking: (id: string) => [...orderKeys.all, "tracking", id] as const,
  merchantIncoming: (status?: string) =>
    [...orderKeys.all, "merchant", status] as const,
  adminAll: (filters?: object) => [...orderKeys.all, "admin", filters] as const,
};

export function useMyOrders(status?: string) {
  return useQuery({
    queryKey: orderKeys.myOrders(status),
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const { data } = await api.get<Order[]>(`/api/orders${params}`);
      return data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Order>(`/api/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useOrderTracking(id: string) {
  return useQuery({
    queryKey: orderKeys.tracking(id),
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}/tracking`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 1000 * 30, // 30 sn polling (SignalR yokken fallback)
  });
}

export function useMerchantIncomingOrders(status?: string) {
  return useQuery({
    queryKey: orderKeys.merchantIncoming(status),
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const { data } = await api.get<Order[]>(`/api/merchants/orders${params}`);
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderDto) =>
      api.post<{ orderId: string; paymentToken: string }>("/api/orders", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    },
  });
}

export function usePackOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/api/merchants/orders/${orderId}/pack`),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.merchantIncoming() });
    },
  });
}
