"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface MerchantProfile {
  id: string;
  storeName: string;
  slug: string;
  latitude: number;
  longitude: number;
  handlingHours: number;
  subscriptionPlan: "BASIC" | "PRO" | "ENTERPRISE";
}

export interface MerchantOffer {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  categoryName?: string;
  price: number;
  stock: number;
  publishToMarket: boolean;
  publishToStore: boolean;
  rating: number;
  createdAt: string;
}

export const merchantKeys = {
  profile: () => ["merchant", "profile"] as const,
  offers: () => ["merchant", "offers"] as const,
  analytics: (period?: string) => ["merchant", "analytics", period] as const,
  adminList: () => ["admin", "merchants"] as const,
};

// ── Profile ──────────────────────────────────────────────────────────────────

export function useMerchantProfile() {
  return useQuery({
    queryKey: merchantKeys.profile(),
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile>("/api/merchants/profile");
      return data;
    },
  });
}

export function useUpdateMerchantProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<MerchantProfile>) =>
      api.put("/api/merchants/profile", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
    },
  });
}

// ── Offers ───────────────────────────────────────────────────────────────────

export function useMerchantOffers() {
  return useQuery({
    queryKey: merchantKeys.offers(),
    queryFn: async () => {
      const { data } = await api.get<{ items: MerchantOffer[]; total: number }>(
        " /api/merchants/offers",
      );
      // API { total, page, limit, items } döndürüyor
      return Array.isArray(data) ? data : ((data as any).items ?? []);
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      productId: string;
      price: number;
      stock: number;
      publishToMarket?: boolean;
      publishToStore?: boolean;
    }) => api.post("/api/merchants/offers", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.offers() });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      price?: number;
      stock?: number;
      publishToMarket?: boolean;
      publishToStore?: boolean;
    }) => api.put(`/api/merchants/offers/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.offers() });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/merchants/offers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.offers() });
    },
  });
}

export function usePublishToggle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      publishToMarket,
      publishToStore,
    }: {
      id: string;
      publishToMarket?: boolean;
      publishToStore?: boolean;
    }) =>
      api.patch(`/api/merchants/offers/${id}/publish`, {
        publishToMarket,
        publishToStore,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.offers() });
    },
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminMerchantList() {
  return useQuery({
    queryKey: merchantKeys.adminList(),
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile[]>("/api/admin/merchants");
      return data;
    },
  });
}
