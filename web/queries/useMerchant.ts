// web/queries/useMerchant.ts
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
  productImage: string;
  price: number;
  stock: number;
  publishToMarket: boolean;
  publishToStore: boolean;
  rating: number;
}

export const merchantKeys = {
  profile: () => ["merchant", "profile"] as const,
  offers: () => ["merchant", "offers"] as const,
  analytics: (period?: string) => ["merchant", "analytics", period] as const,
  adminList: () => ["admin", "merchants"] as const,
};

export function useMerchantProfile() {
  return useQuery({
    queryKey: merchantKeys.profile(),
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile>("/api/merchant/profile");
      return data;
    },
  });
}

export function useMerchantOffers() {
  return useQuery({
    queryKey: merchantKeys.offers(),
    queryFn: async () => {
      const { data } = await api.get<MerchantOffer[]>("/api/merchant/offers");
      return data;
    },
  });
}

export function useUpdateMerchantProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<MerchantProfile>) =>
      api.put("/api/merchant/profile", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
    },
  });
}

export function useToggleOfferPublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      offerId,
      publishToMarket,
      publishToStore,
    }: {
      offerId: string;
      publishToMarket?: boolean;
      publishToStore?: boolean;
    }) =>
      api.patch(`/api/merchant/offers/${offerId}/publish`, {
        publishToMarket,
        publishToStore,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.offers() });
    },
  });
}

export function useAdminMerchantList() {
  return useQuery({
    queryKey: merchantKeys.adminList(),
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile[]>("/api/admin/merchants");
      return data;
    },
  });
}
