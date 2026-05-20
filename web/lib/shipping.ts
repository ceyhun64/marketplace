// ─────────────────────────────────────────────────────────────────────────────
// lib/shipping.ts — Client-side ETA calculation (Haversine) + shipping helpers
// Mirrors the logic in the backend ShippingCalculatorService exactly
// ─────────────────────────────────────────────────────────────────────────────

import {
  SHIPPING_COSTS,
  AVG_COURIER_SPEED_KMH,
  ETA_BUFFER_PERCENT,
} from "./constants";
import type { ShippingRate } from "@/types/enums";

// ── Haversine Formula ─────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the straight-line distance between two coordinates in kilometres.
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

// ── ETA Calculation ───────────────────────────────────────────────────────────

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
  /** Merchant's package preparation time in hours. Default: 24 */
  handlingHours?: number;
}

/**
 * Client-side ETA calculation.
 * Used for live previews on the checkout page.
 * The authoritative ETA comes from the backend (/api/fulfillment/calculate-eta).
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

  // Transit time = distance / speed × (1 + buffer)
  const baseSpeed = AVG_COURIER_SPEED_KMH[shippingRate];
  const rawTransitHours = distanceKm / baseSpeed;
  const transitHours = rawTransitHours * (1 + ETA_BUFFER_PERCENT / 100);

  const totalHours = handlingHours + transitHours;

  const now = new Date();

  // Pickup window: 2-hour window after handling time ends
  const pickupStart = new Date(now.getTime() + handlingHours * 3_600_000);
  const pickupEnd = new Date(pickupStart.getTime() + 2 * 3_600_000);

  // Delivery window: transit + 2-hour window after pickup
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
 * Returns a human-readable ETA label.
 * @example getEtaLabel("EXPRESS", 6) → "Same day or next day delivery"
 */
export function getEtaLabel(
  shippingRate: ShippingRate,
  totalHours: number,
): string {
  if (shippingRate === "EXPRESS") {
    if (totalHours <= 24) return "Same day or next day delivery";
    return "Delivered within 1–2 business days";
  }
  const days = Math.ceil(totalHours / 24);
  if (days <= 3) return "Delivered within 2–3 business days";
  return "Delivered within 3–5 business days";
}

// ── Shipping Cost ─────────────────────────────────────────────────────────────

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
      label: rate === "EXPRESS" ? "Express Delivery" : "Standard Delivery",
      description:
        rate === "EXPRESS"
          ? "Fast delivery with priority courier"
          : "Economy delivery option",
      cost: SHIPPING_COSTS[rate],
      etaLabel,
    };
  });
}

// ── Shipping Label QR URL ─────────────────────────────────────────────────────

/**
 * Builds a QR access URL from a tracking number.
 */
export function getTrackingUrl(
  trackingNumber: string,
  baseUrl?: string,
): string {
  const base =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/track/${trackingNumber}`;
}
