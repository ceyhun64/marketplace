"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Zap, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingRate } from "@/types/enums";
import { SHIPPING_COSTS } from "@/types/enums";
import {
  useAllShippingOptions,
  type ShippingOption,
} from "@/queries/useShipping";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ShippingRateSelectProps {
  merchantId: string;
  destinationLat?: number;
  destinationLng?: number;
  value: ShippingRate | null;
  onChange: (rate: ShippingRate) => void;
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatWindow(start?: string, end?: string): string {
  if (!start || !end) return "";
  const s = format(new Date(start), "d MMM", { locale: tr });
  const e = format(new Date(end), "d MMM", { locale: tr });
  return s === e ? s : `${s} – ${e}`;
}

// ── Sub-component: tek bir kargo seçeneği kartı ────────────────────────────

function ShippingOptionCard({
  option,
  selected,
  onSelect,
  isLoading,
}: {
  option: ShippingOption;
  selected: boolean;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const Icon = option.rate === "EXPRESS" ? Zap : Package;
  const etaWindow = option.eta
    ? formatWindow(
        option.eta.estimatedDeliveryStart,
        option.eta.estimatedDeliveryEnd,
      )
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      {/* Seçim göstergesi */}
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>

      {/* İkon */}
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          selected ? "text-primary" : "text-muted-foreground",
        )}
      />

      {/* İçerik */}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{option.label}</span>
          <span className="font-semibold tabular-nums">
            {option.cost.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
            })}
          </span>
        </div>

        <div className="mt-1 text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculating estimated time…
            </span>
          ) : etaWindow ? (
            <span>
              Tahmini teslimat:{" "}
              <span className={selected ? "text-primary font-medium" : ""}>
                {etaWindow}
              </span>
            </span>
          ) : (
            <span>Delivery date is calculated once an address is entered.</span>
          )}
        </div>

        {option.eta && (
          <div className="mt-1 text-xs text-muted-foreground">
            {option.eta.distanceKm.toFixed(0)} km · Kargo: ₺
            {option.eta.shippingCost.toFixed(2)}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ShippingRateSelect({
  merchantId,
  destinationLat,
  destinationLng,
  value,
  onChange,
  className,
}: ShippingRateSelectProps) {
  const { options, isLoading } = useAllShippingOptions({
    merchantId,
    destinationLat,
    destinationLng,
  });

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium">Shipping option</p>
      {options.map((option) => (
        <ShippingOptionCard
          key={option.rate}
          option={option}
          selected={value === option.rate}
          onSelect={() => onChange(option.rate)}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

export default ShippingRateSelect;
