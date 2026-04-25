// ─────────────────────────────────────────────────────────────────────────────
// lib/shipping.ts — Client-side ETA hesaplama (Haversine) + kargo yardımcıları
// Backend ShippingCalculatorService ile birebir aynı mantık
// ─────────────────────────────────────────────────────────────────────────────

import {
  SHIPPING_COSTS,
  AVG_COURIER_SPEED_KMH,
  ETA_BUFFER_PERCENT,
} from "./constants";
import type { ShippingRate } from "@/types/enums";

// ── Haversine Formülü ─────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * İki koordinat arasındaki kuş uçuşu mesafeyi km cinsinden hesaplar.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ── ETA Hesaplama ─────────────────────────────────────────────────────────────

export interface EtaResult {
  distanceKm: number;
  handlingHours: number;
  transitHours: number;
  totalHours: number;
  estimatedPickupStart: Date;
  estimatedPickupEnd: Date;
  estimatedDeliveryStart: Date;
  estimatedDeliveryEnd: Date;
}

export interface EtaParams {
  merchantLat: number;
  merchantLon: number;
  customerLat: number;
  customerLon: number;
  shippingRate: ShippingRate;
  /** Merchant'ın paket hazırlama süresi (hours). Default 24 */
  handlingHours?: number;
}

/**
 * Client-side ETA hesaplama.
 * Checkout sayfasında anlık önizleme için kullanılır.
 * Gerçek ETA backend'den gelir (/api/fulfillment/calculate-eta).
 */
export function calculateEta(params: EtaParams): EtaResult {
  const {
    merchantLat,
    merchantLon,
    customerLat,
    customerLon,
    shippingRate,
    handlingHours = 24,
  } = params;

  const distanceKm = haversineDistance(
    merchantLat,
    merchantLon,
    customerLat,
    customerLon,
  );

  // Transit süresi = mesafe / hız * (1 + buffer)
  const baseSpeed = AVG_COURIER_SPEED_KMH[shippingRate];
  const rawTransitHours = distanceKm / baseSpeed;
  const transitHours = rawTransitHours * (1 + ETA_BUFFER_PERCENT / 100);

  const totalHours = handlingHours + transitHours;

  const now = new Date();

  // Pickup penceresi: handling süresi bittikten sonra 2 hourslik pencere
  const pickupStart = new Date(now.getTime() + handlingHours * 3_600_000);
  const pickupEnd = new Date(pickupStart.getTime() + 2 * 3_600_000);

  // Delivery penceresi: pickup'tan sonra transit + 2 hourslik pencere
  const deliveryStart = new Date(
    pickupEnd.getTime() + transitHours * 3_600_000,
  );
  const deliveryEnd = new Date(deliveryStart.getTime() + 2 * 3_600_000);

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    handlingHours,
    transitHours: Math.ceil(transitHours),
    totalHours: Math.ceil(totalHours),
    estimatedPickupStart: pickupStart,
    estimatedPickupEnd: pickupEnd,
    estimatedDeliveryStart: deliveryStart,
    estimatedDeliveryEnd: deliveryEnd,
  };
}

/**
 * ETA'yı insan okunabilir formatta döndürür.
 * @example getEtaLabel({ shippingRate: "EXPRESS", totalHours: 6 })
 *   → "1-2 iş günü içinde teslim"
 */
export function getEtaLabel(
  shippingRate: ShippingRate,
  totalHours: number,
): string {
  if (shippingRate === "EXPRESS") {
    if (totalHours <= 24) return "Aynı gün veya yarın teslim";
    return "1-2 iş günü içinde teslim";
  }
  const days = Math.ceil(totalHours / 24);
  if (days <= 3) return "2-3 iş günü içinde teslim";
  return "3-5 iş günü içinde teslim";
}

// ── Kargo Maliyeti ────────────────────────────────────────────────────────────

export function getShippingCost(rate: ShippingRate): number {
  return SHIPPING_COSTS[rate];
}

export interface ShippingOption {
  rate: ShippingRate;
  label: string;
  description: string;
  cost: number;
  etaLabel?: string;
}

export function getShippingOptions(
  etaParams?: Omit<EtaParams, "shippingRate">,
): ShippingOption[] {
  const rates: ShippingRate[] = ["EXPRESS", "REGULAR"];

  return rates.map((rate) => {
    let etaLabel: string | undefined;

    if (etaParams) {
      const result = calculateEta({ ...etaParams, shippingRate: rate });
      etaLabel = getEtaLabel(rate, result.totalHours);
    }

    return {
      rate,
      label: rate === "EXPRESS" ? "Ekspres Teslimat" : "Standart Teslimat",
      description:
        rate === "EXPRESS"
          ? "Hızlı teslimat, öncelikli kurye"
          : "Ekonomik teslimat seçeneği",
      cost: SHIPPING_COSTS[rate],
      etaLabel,
    };
  });
}

// ── Kargo Labeli QR URL ──────────────────────────────────────────────────────

/**
 * Takip numarasından QR erişim URL'si oluşturur.
 */
export function getTrackingUrl(
  trackingNumber: string,
  baseUrl?: string,
): string {
  const base =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/track/${trackingNumber}`;
}
