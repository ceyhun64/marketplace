"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SHIPPING_COSTS } from "@/lib/constants";
import type { ShippingRate } from "@/types/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EtaRequest {
  merchantId: string;
  shippingRate: ShippingRate;
  /** Customer coordinates */
  destinationLat: number;
  destinationLng: number;
}

export interface EtaResponse {
  shippingRate: ShippingRate;
  estimatedPickupStart: string; // ISO date
  estimatedPickupEnd: string;
  estimatedDeliveryStart: string;
  estimatedDeliveryEnd: string;
  distanceKm: number;
  transitHours: number;
  handlingHours: number;
  shippingCost: number;
}

export interface ShippingOption {
  rate: ShippingRate;
  label: string;
  cost: number;
  eta?: EtaResponse;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const shippingKeys = {
  all: ["shipping"] as const,
  eta: (params: EtaRequest) => [...shippingKeys.all, "eta", params] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Calculate ETA — Haversine distance + merchant handling time.
 * Runs automatically when `merchantId` and coordinates are provided.
 */
export function useEta(params: Partial<EtaRequest>) {
  const isReady =
    !!params.merchantId &&
    !!params.shippingRate &&
    params.destinationLat !== undefined &&
    params.destinationLng !== undefined;

  return useQuery({
    queryKey: shippingKeys.eta(params as EtaRequest),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        merchantId: params.merchantId!,
        shippingRate: params.shippingRate!,
        destLat: String(params.destinationLat),
        destLng: String(params.destinationLng),
      });
      const { data } = await api.get<EtaResponse>(
        `/api/fulfillment/calculate-eta?${searchParams}`,
      );
      return data;
    },
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes — ETA changes infrequently
  });
}

/**
 * Calculate ETAs for both shipping options (EXPRESS + REGULAR) simultaneously.
 * Designed for use in the ShippingRateSelect component.
 */
export function useAllShippingOptions(params: {
  merchantId?: string;
  destinationLat?: number;
  destinationLng?: number;
}) {
  const isReady =
    !!params.merchantId &&
    params.destinationLat !== undefined &&
    params.destinationLng !== undefined;

  const expressQuery = useEta({
    ...params,
    shippingRate: "EXPRESS",
  });

  const regularQuery = useEta({
    ...params,
    shippingRate: "REGULAR",
  });

  const options: ShippingOption[] = [
    {
      rate: "EXPRESS",
      label: "Express (1-2 days)",
      cost: SHIPPING_COSTS.EXPRESS,
      eta: expressQuery.data,
    },
    {
      rate: "REGULAR",
      label: "Standard (3-5 days)",
      cost: SHIPPING_COSTS.REGULAR,
      eta: regularQuery.data,
    },
  ];

  return {
    options,
    isLoading: isReady && (expressQuery.isLoading || regularQuery.isLoading),
    isError: expressQuery.isError || regularQuery.isError,
  };
}
