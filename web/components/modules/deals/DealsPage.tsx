"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Tag,
  Clock,
  ChevronRight,
  Sparkles,
  Home,
  ChevronDown,
  ChevronLeft,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/entities";

function useDealsProducts() {
  return useQuery({
    queryKey: ["products", "deals"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>("/api/products/featured?limit=48");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

type Filter  = "all" | "lowstock" | "new";
type SortKey = "default" | "price_asc" | "price_desc" | "rating";

const FILTERS: { key: Filter; label: string; icon: React.ReactNode }[] = [
  { key: "all",      label: "All Deals",    icon: <Tag      className="w-3.5 h-3.5" /> },
  { key: "lowstock", label: "Almost Gone",  icon: <Clock    className="w-3.5 h-3.5" /> },
  { key: "new",      label: "Newly Added",  icon: <Sparkles className="w-3.5 h-3.5" /> },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default",    label: "Featured" },
  { key: "price_asc",  label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "rating",     label: "Highest Rated" },
];

const PAGE_SIZE = 12;

// Smart pagination: show first, last, current ±1, ellipsis between gaps
function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current - 1, current, current + 1].filter(
    (n) => n >= 1 && n <= total,
  ));
  const sorted = Array.from(set).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DealSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/6">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const { data: products, isLoading, isError } = useDealsProducts();
  const { addItem } = useCart();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [sort,  setSort]  = useState<SortKey>("default");
  const [page,  setPage]  = useState(1);

  const thirtyDaysAgo = useMemo(
    () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    [],
  );

  const filtered = useMemo(() => {
    let list = products ?? [];

    if (activeFilter === "lowstock") {
      list = list.filter((p) => p.stock > 0 && p.stock <= 10);
    } else if (activeFilter === "new") {
      const recent = list.filter(
        (p) => p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo,
      );
      list = recent.length > 0 ? recent : list;
    }

    return [...list].sort((a, b) => {
      if (sort === "price_asc")  return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return 0;
    });
  }, [products, activeFilter, sort, thirtyDaysAgo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages      = buildPages(page, totalPages);

  const handleFilterChange = (f: Filter) => { setActiveFilter(f); setPage(1); };
  const handleSort         = (k: SortKey) => { setSort(k);          setPage(1); };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 75% 40%, rgba(200,16,46,0.18) 0%, transparent 55%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 mb-6 text-[12px]"
            style={{ color: "var(--charcoal-soft)" }}
          >
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

          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[3px]"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-jetbrains)",
              }}
            >
              Best Offers
            </span>
          </div>

          <h1
            className="leading-tight mb-2 text-white"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 600,
            }}
          >
            Today&apos;s{" "}
            <span style={{ color: "var(--red-light)" }}>Deals</span>
          </h1>
          <p
            className="text-[15px] mb-8"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Hand-picked offers from our top sellers. Don&apos;t miss out.
          </p>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150"
                style={
                  activeFilter === f.key
                    ? { background: "#c8102e", color: "#fff" }
                    : {
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }
                }
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div
        className="bg-white sticky top-0 z-10 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Left: count + shipping nudge */}
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
              {isLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--charcoal)" }}
                  >
                    {filtered.length.toLocaleString()}
                  </span>{" "}
                  {filtered.length === 1 ? "deal" : "deals"}
                </span>
              )}
            </div>
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(200,16,46,0.07)",
                color: "var(--red)",
              }}
            >
              <ShoppingCart className="w-3 h-3" />
              Free shipping over $500
            </div>
          </div>

          {/* Right: sort */}
          <div className="relative">
            <ChevronDown
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "var(--charcoal-mist)" }}
            />
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value as SortKey)}
              className="h-9 pl-3 pr-9 text-sm rounded-lg appearance-none cursor-pointer outline-none"
              style={{
                background: "white",
                border: "1px solid var(--border-light)",
                color: "var(--charcoal)",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Error */}
        {isError && (
          <div className="text-center py-20">
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
            >
              Failed to load deals. Please try again.
            </div>
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <DealSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(30,30,30,0.05)" }}
            >
              <Package className="w-6 h-6" style={{ color: "var(--charcoal-mist)" }} />
            </div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--charcoal)" }}
            >
              No deals for this filter
            </p>
            <p className="text-xs" style={{ color: "var(--charcoal-mist)" }}>
              Try switching to a different filter above
            </p>
            <button
              onClick={() => handleFilterChange("all")}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
            >
              Show all deals
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {paginated.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  context="marketplace"
                  onAddToCart={() =>
                    addItem({
                      offerId:           product.id,
                      productId:         product.id,
                      productName:       product.name,
                      productImage:      product.images?.[0] ?? "",
                      merchantId:        product.merchantId,
                      merchantStoreName: product.merchantStoreName,
                      merchantSlug:      product.merchantSlug,
                      price:             product.price,
                      stock:             product.stock,
                      source:            "MARKETPLACE",
                    })
                  }
                />
              ))}
            </div>

            {/* Smart pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--border-light)", color: "var(--charcoal)" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pages.map((pg, i) =>
                  pg === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="w-9 h-9 flex items-center justify-center text-sm"
                      style={{ color: "var(--charcoal-mist)" }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={pg}
                      onClick={() => setPage(pg as number)}
                      className="w-9 h-9 rounded-lg text-[13px] font-semibold transition-all"
                      style={
                        page === pg
                          ? { background: "#c8102e", color: "white" }
                          : {
                              border: "1px solid var(--border-light)",
                              color: "var(--charcoal)",
                              background: "white",
                            }
                      }
                    >
                      {pg}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--border-light)", color: "var(--charcoal)" }}
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
