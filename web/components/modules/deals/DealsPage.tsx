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
  Home,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
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
type SortKey = "default" | "price_asc" | "price_desc";

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

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Featured" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 12;

export default function DealsPage() {
  const { data: products, isLoading, isError } = useDealsProducts();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = (products ?? [])
    .filter((p) => {
      if (activeFilter === "lowstock")
        return p.stock !== undefined && p.stock <= 10;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sort";

  const handleFilterChange = (f: Filter) => {
    setActiveFilter(f);
    setPage(1);
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full" />
        <div className="absolute -bottom-16 left-32 w-32 h-32 border-[16px] border-[var(--charcoal-mid)]/15 rounded-full" />

        <div className="max-w-325 mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-5 text-[12px] text-[var(--charcoal-soft)]">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home className="w-3 h-3" />
              Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">Deals</span>
          </nav>

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
                onClick={() => handleFilterChange(f.key)}
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
        <div className="max-w-325 mx-auto flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2 font-semibold">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            Free shipping on orders over $500
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
      <div className="max-w-325 mx-auto px-4 lg:px-8 py-12">
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
            {/* Results bar with sort */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[var(--charcoal-soft)]">
                <strong className="text-[var(--charcoal)]">
                  {filtered.length}
                </strong>{" "}
                deals available
              </p>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen((p) => !p)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/10 text-[13px] font-semibold text-[var(--charcoal)] hover:border-[var(--charcoal)] transition-colors bg-white"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {activeSortLabel}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-black/10 shadow-lg z-20 min-w-[200px] overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSort(opt.key);
                          setSortOpen(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--off-white)] transition-colors ${sort === opt.key ? "font-bold text-[var(--red)]" : "text-[var(--charcoal)]"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {paginated.map((p) => (
                <ProductCard key={p.id} product={p} context="marketplace" />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[var(--charcoal)] hover:border-[var(--charcoal)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-full text-[13px] font-bold transition-all ${
                      page === i + 1
                        ? "bg-[var(--red)] text-white"
                        : "border border-black/10 text-[var(--charcoal)] hover:border-[var(--charcoal)]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[var(--charcoal)] hover:border-[var(--charcoal)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
