"use client";

import { useMemo } from "react";
import { Map, CalendarDays } from "lucide-react";
import { calculateEta, getEtaLabel, type EtaParams } from "@/lib/shipping";
import { formatEtaWindow, formatPrice } from "@/lib/format";
import { SHIPPING_COSTS } from "@/lib/constants";
import type { ShippingRate } from "@/types/enums";

interface Props {
  merchantLat: number;
  merchantLon: number;
  customerLat: number;
  customerLon: number;
  handlingHours?: number;
  selectedRate: ShippingRate;
  onSelectRate: (rate: ShippingRate) => void;
  /** Server-side ETA (more accurate) — overrides client calculation if provided */
  serverEta?: {
    estimatedDeliveryStart: string;
    estimatedDeliveryEnd: string;
    distanceKm: number;
  } | null;
}

export default function ETADisplay({
  merchantLat,
  merchantLon,
  customerLat,
  customerLon,
  handlingHours = 24,
  selectedRate,
  onSelectRate,
  serverEta,
}: Props) {
  const expressEta = useMemo(
    () =>
      calculateEta({
        merchantLat,
        merchantLon,
        customerLat,
        customerLon,
        shippingRate: "EXPRESS",
        handlingHours,
      }),
    [merchantLat, merchantLon, customerLat, customerLon, handlingHours],
  );

  const regularEta = useMemo(
    () =>
      calculateEta({
        merchantLat,
        merchantLon,
        customerLat,
        customerLon,
        shippingRate: "REGULAR",
        handlingHours,
      }),
    [merchantLat, merchantLon, customerLat, customerLon, handlingHours],
  );

  const OPTIONS: Array<{
    rate: ShippingRate;
    label: string;
    eta: typeof expressEta;
    description: string;
  }> = [
    {
      rate: "EXPRESS",
      label: "Ekspres Teslimat",
      eta: expressEta,
      description: "Priority courier, fast delivery",
    },
    {
      rate: "REGULAR",
      label: "Standart Teslimat",
      eta: regularEta,
      description: "Economical option",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-[3px] text-[var(--charcoal-soft)]">
        Shipping Option
      </p>

      {/* Distance info */}
      <div className="flex items-center gap-2 text-xs text-[var(--charcoal-soft)]">
        <Map className="w-3.5 h-3.5 shrink-0" />
        <span>
          Tahmini mesafe:{" "}
          <strong className="text-[var(--charcoal)]">
            {serverEta?.distanceKm ?? expressEta.distanceKm} km
          </strong>
        </span>
      </div>

      {OPTIONS.map(({ rate, label, eta, description }) => {
        const isSelected = selectedRate === rate;
        const deliveryWindow =
          serverEta && rate === selectedRate
            ? formatEtaWindow(
                serverEta.estimatedDeliveryStart,
                serverEta.estimatedDeliveryEnd,
              )
            : formatEtaWindow(
                eta.estimatedDeliveryStart.toISOString(),
                eta.estimatedDeliveryEnd.toISOString(),
              );

        return (
          <button
            key={rate}
            onClick={() => onSelectRate(rate)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              isSelected
                ? "border-[var(--red)] bg-[var(--red)]/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Radio */}
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-[var(--red)]" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--red)]" />
                  )}
                </div>

                <div>
                  <p
                    className={`text-sm font-semibold ${isSelected ? "text-[var(--red)]" : "text-[var(--charcoal)]"}`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-[var(--charcoal-soft)] mt-0.5">
                    {description}
                  </p>
                  <p className="text-xs font-mono text-[var(--chart-3)] mt-1">
                    <CalendarDays className="w-3 h-3 inline mr-1" />{getEtaLabel(rate, eta.totalHours)}
                  </p>
                  <p className="text-[11px] text-[var(--charcoal-soft)] mt-0.5 font-mono">
                    {deliveryWindow}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="font-semibold font-heading text-[var(--charcoal)]">
                  {formatPrice(SHIPPING_COSTS[rate])}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
