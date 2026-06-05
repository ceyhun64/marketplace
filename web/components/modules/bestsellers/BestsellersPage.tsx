"use client";

import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  Star,
  ArrowRight,
  Flame,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";
import { useState } from "react";

function useBestsellers() {
  return useQuery({
    queryKey: ["products", "bestsellers"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        "/api/products/featured?limit=24&sort=popular",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

const STATS = [
  {
    icon: <Flame className="w-4 h-4" />,
    label: "Trending Now",
    value: "48 products",
  },
  {
    icon: <Star className="w-4 h-4" />,
    label: "Top Rated",
    value: "4.8+ stars",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Sales Growth",
    value: "+32% this week",
  },
];

type SortKey = "popular" | "rating" | "price_asc" | "price_desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most Popular" },
  { key: "rating", label: "Highest Rated" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-black/5"
        >
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BestsellersPage() {
  const { data: products, isLoading, isError } = useBestsellers();
  const [sort, setSort] = useState<SortKey>("popular");
  const [sortOpen, setSortOpen] = useState(false);

  const sortedProducts = [...(products ?? [])].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0; // popular / rating: API-ordered
  });

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sort";

  return (
    <main className="min-h-screen">
      {/* Hero — amber/gold "achievement" identity */}
      <div
        className="py-14 px-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1200 0%, #231800 50%, #1c1400 100%)",
        }}
      >
        {/* Decorative rings */}
        <div
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none"
          style={{ border: "24px solid rgba(245,158,11,0.1)" }}
        />
        <div
          className="absolute -bottom-16 left-32 w-36 h-36 rounded-full pointer-events-none"
          style={{ border: "16px solid rgba(245,158,11,0.06)" }}
        />
        {/* Large faint trophy watermark */}
        <Trophy
          className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ width: 120, height: 120, color: "rgba(245,158,11,0.06)" }}
        />
        {/* Bottom accent */}
        <div
          className="absolute bottom-0 left-0 w-full h-0.5 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.5) 0%, transparent 55%)" }}
        />

        <div className="max-w-325 mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy style={{ width: 14, height: 14, color: "rgba(251,191,36,0.9)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "rgba(251,191,36,0.6)" }}
            >
              Top Ranked
            </span>
          </div>
          <h1
            className="text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            Best{" "}
            <span style={{ color: "rgba(251,191,36,0.9)" }}>Sellers</span>
          </h1>
          <p className="text-[15px] mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            The products our customers love most — ranked by sales and reviews.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                  style={{
                    background: "rgba(245,158,11,0.15)",
                    color: "rgba(251,191,36,0.9)",
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {stat.label}
                  </div>
                  <div
                    className="font-bold text-sm"
                    style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-body)" }}
                  >
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-325 mx-auto px-4 lg:px-8 py-10">
        {/* Top 3 podium */}
        {!isLoading &&
          !isError &&
          sortedProducts &&
          sortedProducts.length >= 3 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="inline-block w-6 h-px"
                  style={{ background: "var(--red)" }}
                />
                <span
                  className="font-mono text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Top 3 This Week
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {sortedProducts.slice(0, 3).map((product, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const borderColors = [
                    "rgba(250,204,21,0.4)",
                    "rgba(209,213,219,0.4)",
                    "rgba(217,119,6,0.4)",
                  ];
                  return (
                    <div
                      key={product.id}
                      className="relative"
                      style={{
                        borderRadius: "var(--radius-lg)",
                        border: `2px solid ${borderColors[i]}`,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="absolute top-3 left-3 z-20 text-2xl pointer-events-none select-none">
                        {medals[i]}
                      </div>
                      <ProductCard product={product} context="marketplace" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* All products */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red)" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--charcoal-soft)" }}
            >
              All Best Sellers
            </span>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((p) => !p)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/10 text-[13px] font-semibold text-(--charcoal) hover:border-(--charcoal) transition-colors bg-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeSortLabel}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-black/10 shadow-lg z-20 min-w-47.5 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSort(opt.key);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-(--off-white) transition-colors ${sort === opt.key ? "font-bold text-(--red)" : "text-(--charcoal)"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading && <SkeletonGrid />}

        {isError && (
          <div className="text-center py-20">
            <Trophy
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "rgba(51,51,51,0.15)" }}
            />
            <p className="text-(--charcoal-soft)">
              Could not load products. Please try again.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          sortedProducts &&
          sortedProducts.length === 0 && (
            <div className="text-center py-20">
              <Trophy
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "rgba(51,51,51,0.15)" }}
              />
              <h2 className="text-xl font-bold text-(--charcoal) mb-2">
                No bestsellers yet
              </h2>
              <p className="text-(--charcoal-soft) mb-6">
                Check back soon — rankings update weekly.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--charcoal)" }}
              >
                Browse All Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

        {!isLoading &&
          !isError &&
          sortedProducts &&
          sortedProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedProducts.map((product, i) => (
                <div key={product.id} className="relative">
                  {i < 10 && (
                    <div
                      className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold text-white"
                      style={{ background: "var(--red)" }}
                    >
                      {i + 1}
                    </div>
                  )}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}
