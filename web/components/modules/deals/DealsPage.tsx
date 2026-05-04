"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Tag,
  Clock,
  ChevronRight,
  TrendingDown,
  Star,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

function useDealsProducts() {
  return useQuery({
    queryKey: ["products", "deals"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        "/api/products/featured?limit=24",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

type Filter = "all" | "lowstock" | "new";

const FILTERS: { key: Filter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Deals", icon: <Tag className="w-3.5 h-3.5" /> },
  {
    key: "lowstock",
    label: "Almost Gone",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  {
    key: "new",
    label: "Newly Added",
    icon: <TrendingDown className="w-3.5 h-3.5" />,
  },
];

export default function DealsPage() {
  const { data: products, isLoading, isError } = useDealsProducts();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const filtered = (products ?? []).filter((p) => {
    if (activeFilter === "lowstock")
      return p.stock !== undefined && p.stock <= 10;
    return true;
  });

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full" />
        <div className="absolute -bottom-16 left-32 w-32 h-32 border-[16px] border-[var(--charcoal-mid)]/15 rounded-full" />

        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Best Offers
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Today&apos;s <span className="text-[var(--red)]">Deals</span>
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px] mb-8">
            Hand-picked offers from our top sellers. Don&apos;t miss out.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                  activeFilter === f.key
                    ? "bg-[var(--red)] text-white"
                    : "bg-white/10 text-[var(--charcoal-soft)] hover:bg-white/20 hover:text-white"
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA banner */}
      <div className="bg-[var(--charcoal-mid)] text-white py-3 px-4">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2 font-semibold">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            Free shipping on orders over ₺500
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-[#7ec8e3] hover:text-white transition-colors font-semibold"
          >
            All Products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12">
        {isError && (
          <div className="text-center py-20 text-[var(--red)] font-semibold">
            Failed to load deals. Please try again.
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

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20">
            <Tag className="w-14 h-14 text-[var(--charcoal)]/10 mx-auto mb-4" />
            <p className="text-[var(--charcoal-soft)] text-lg font-semibold">
              No deals found for this filter.
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <p className="text-[13px] text-[var(--charcoal-soft)] mb-6">
              <strong className="text-[var(--charcoal)]">
                {filtered.length}
              </strong>{" "}
              deals available
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} context="marketplace" />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
