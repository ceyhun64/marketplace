"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  ChevronRight,
  Flame,
  Tag,
  Star,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

// Flash sale ends 24 hours from page load
const SALE_END = new Date(Date.now() + 24 * 60 * 60 * 1000);

function useFlashSaleProducts() {
  return useQuery({
    queryKey: ["products", "flash-sale"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        "/api/products/featured?limit=24&sort=discount",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

function useCountdown(end: Date) {
  const calc = () => {
    const diff = Math.max(0, end.getTime() - Date.now());
    return {
      hours: Math.floor(diff / 1000 / 60 / 60),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 rounded-lg px-3 py-2 min-w-[52px] text-center">
        <span className="text-white text-[24px] font-bold tabular-nums leading-none">
          {padded}
        </span>
      </div>
      <span className="text-[var(--charcoal-mist)] text-[10px] uppercase tracking-[2px] mt-1">
        {label}
      </span>
    </div>
  );
}

/** Stock progress bar — shows how much of initial stock remains */
function StockBar({
  stock,
  maxStock = 50,
}: {
  stock?: number;
  maxStock?: number;
}) {
  if (stock === undefined) return null;
  const pct = Math.min(100, Math.round((stock / maxStock) * 100));
  const color = pct <= 20 ? "var(--red)" : pct <= 50 ? "#d97706" : "#16a34a";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] font-mono font-bold uppercase tracking-wider"
          style={{ color }}
        >
          {stock <= 0
            ? "Sold Out"
            : stock <= 5
              ? `Only ${stock} left!`
              : `${stock} in stock`}
        </span>
        <span className="text-[10px] text-[var(--charcoal-mist)]">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

type SortKey = "discount" | "lowstock" | "price_asc";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "discount",
    label: "Biggest Discount",
    icon: <Tag className="w-3.5 h-3.5" />,
  },
  {
    key: "lowstock",
    label: "Almost Gone",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  {
    key: "price_asc",
    label: "Lowest Price",
    icon: <Flame className="w-3.5 h-3.5" />,
  },
];

export default function FlashSalePage() {
  const { data: products, isLoading, isError } = useFlashSaleProducts();
  const [sort, setSort] = useState<SortKey>("discount");
  const countdown = useCountdown(SALE_END);

  const sorted = [...(products ?? [])].sort((a, b) => {
    if (sort === "lowstock") return (a.stock ?? 999) - (b.stock ?? 999);
    if (sort === "price_asc") return a.price - b.price;
    return 0; // API already sorted by discount
  });

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-56 h-56 border-[24px] border-[var(--red)]/10 rounded-full" />
        <div className="absolute top-8 -right-4 w-28 h-28 border-[12px] border-[var(--red)]/8 rounded-full" />
        <div className="absolute -bottom-16 left-32 w-32 h-32 border-[16px] border-[var(--charcoal-mid)]/15 rounded-full" />

        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end gap-8 justify-between">
            {/* Title block */}
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[var(--red)]" />
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
                  Limited Time Offer
                </span>
              </div>
              <h1
                className="text-[var(--off-white)] text-[36px] lg:text-[52px] leading-tight mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Flash <span className="text-[var(--red)]">Sale</span>
              </h1>
              <p className="text-[var(--charcoal-soft)] text-[15px] max-w-md">
                Up to 50% off on selected products. Don&apos;t miss out before
                time runs out!
              </p>
            </div>

            {/* Countdown */}
            <div>
              <p className="text-[var(--charcoal-mist)] text-[11px] uppercase tracking-[2px] mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Sale ends in
              </p>
              <div className="flex items-center gap-2">
                <CountdownUnit value={countdown.hours} label="Hours" />
                <span className="text-white text-[22px] font-bold mb-4 opacity-60">
                  :
                </span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="text-white text-[22px] font-bold mb-4 opacity-60">
                  :
                </span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          </div>

          {/* Sort filters */}
          <div className="flex items-center gap-2 flex-wrap mt-8">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                  sort === opt.key
                    ? "bg-[var(--red)] text-white"
                    : "bg-white/10 text-[var(--charcoal-soft)] hover:bg-white/20 hover:text-white"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[var(--red)] text-white py-3 px-4">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2 font-semibold">
            <Star className="w-4 h-4 text-yellow-300" fill="currentColor" />
            Free shipping on orders over $500
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors font-semibold"
          >
            All Products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12">
        {isError && (
          <div className="text-center py-20 text-[var(--red)] font-semibold">
            Could not load products. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-black/5"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <div className="text-center py-20">
            <Zap className="w-14 h-14 text-[var(--charcoal)]/10 mx-auto mb-4" />
            <p className="text-[var(--charcoal-soft)] text-lg font-semibold">
              No active flash sale right now.
            </p>
            <p className="text-[var(--charcoal-mist)] text-sm mt-1">
              New campaigns are coming soon — check back later!
            </p>
          </div>
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <>
            <p className="text-[13px] text-[var(--charcoal-soft)] mb-6">
              <strong className="text-[var(--charcoal)]">
                {sorted.length}
              </strong>{" "}
              products in this flash sale
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {sorted.map((p) => (
                <div key={p.id} className="flex flex-col">
                  <ProductCard product={p} context="marketplace" />
                  <div className="px-1 -mt-1">
                    <StockBar stock={p.stock} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
