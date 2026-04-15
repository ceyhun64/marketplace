// web/queries/useBuyBox.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ProductOffer {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  price: number;
  stock: number;
  rating: number;
  estimatedDelivery: string; // ISO date string
  handlingHours: number;
}

export interface BuyBoxResult {
  winner: ProductOffer;
  otherSellers: ProductOffer[];
}

export const buyBoxKeys = {
  all: ["buybox"] as const,
  product: (productId: string, lat?: number, lng?: number) =>
    [...buyBoxKeys.all, productId, lat, lng] as const,
};

export function useBuyBox(
  productId: string,
  customerLat?: number,
  customerLng?: number,
) {
  return useQuery({
    queryKey: buyBoxKeys.product(productId, customerLat, customerLng),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerLat) params.set("customerLat", String(customerLat));
      if (customerLng) params.set("customerLng", String(customerLng));

      const { data } = await api.get<BuyBoxResult>(
        `/api/products/${productId}/buybox?${params}`,
      );
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 30, // 30 saniye — fiyatlar sık değişebilir
    refetchInterval: 1000 * 60, // 1 dakikada bir arka planda yenile
  });
}

export function useProductOffers(productId: string) {
  return useQuery({
    queryKey: [...buyBoxKeys.all, productId, "offers"],
    queryFn: async () => {
      const { data } = await api.get<ProductOffer[]>(
        `/api/products/${productId}/offers`,
      );
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 30,
  });
}
