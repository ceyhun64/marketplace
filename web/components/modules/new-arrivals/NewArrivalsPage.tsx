"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Clock, SlidersHorizontal, ChevronDown, Bell, BellOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { toast } from "sonner";
import type { Product } from "@/types/entities";

function useNewArrivals() {
  return useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        "/api/products/featured?limit=24&sort=newest",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

type SortKey = "newest" | "price_asc" | "price_desc" | "name";
type FilterKey = "all" | "today" | "week";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "name", label: "Name: A – Z" },
];

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
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

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
}

export default function NewArrivalsPage() {
  const { data: products, isLoading, isError } = useNewArrivals();
  const [sort, setSort] = useState<SortKey>("newest");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  const handleNotify = () => {
    setNotifyEnabled((prev) => {
      const next = !prev;
      if (next) {
        toast.success("You'll be notified when new products arrive!", {
          description: "We'll send you an email for each new drop.",
        });
      } else {
        toast("Notifications turned off.");
      }
      return next;
    });
  };

  const filtered = useMemo(() => (products ?? [])
    .filter((p) => {
      if (!p.createdAt) return true;
      // eslint-disable-next-line react-hooks/purity
      const days = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (filter === "today") return days < 1;
      if (filter === "week") return days < 7;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      // newest: by createdAt desc
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    }), [products, filter, sort]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sort";

  return (
    <main className="min-h-screen">
      {/* Hero — emerald "fresh drop" identity */}
      <div
        className="py-14 px-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #071d18 0%, #0d2b22 50%, #0f1e1c 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
          style={{ border: "28px solid rgba(5,150,105,0.09)" }}
        />
        <div
          className="absolute bottom-8 left-24 w-32 h-32 rounded-full pointer-events-none"
          style={{ border: "16px solid rgba(5,150,105,0.06)" }}
        />
        {/* Floating sparkle accents */}
        <Sparkles
          className="absolute top-6 right-1/4 pointer-events-none"
          style={{ width: 18, height: 18, color: "rgba(52,211,153,0.35)" }}
        />
        <Sparkles
          className="absolute bottom-8 right-16 pointer-events-none"
          style={{ width: 12, height: 12, color: "rgba(52,211,153,0.2)" }}
        />
        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 w-full h-0.5 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(5,150,105,0.6) 0%, transparent 60%)" }}
        />

        <div className="max-w-325 mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles style={{ width: 14, height: 14, color: "rgba(52,211,153,0.9)" }} />
                <span
                  className="font-mono text-[10px] uppercase tracking-[3px]"
                  style={{ color: "rgba(52,211,153,0.7)" }}
                >
                  Just Dropped
                </span>
              </div>
              <h1
                className="text-[36px] lg:text-[48px] leading-tight mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                New{" "}
                <span style={{ color: "rgba(52,211,153,0.9)" }}>Arrivals</span>
              </h1>
              <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                Fresh products from our sellers — updated daily.
              </p>
            </div>

            {/* Notify Me button */}
            <button
              onClick={handleNotify}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] transition-all shrink-0"
              style={
                notifyEnabled
                  ? {
                      background: "rgba(5,150,105,0.15)",
                      color: "rgba(52,211,153,0.9)",
                      border: "1px solid rgba(5,150,105,0.35)",
                    }
                  : {
                      background: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }
              }
            >
              {notifyEnabled ? (
                <>
                  <BellOff className="w-4 h-4" />
                  Notifications On
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Notify Me
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-325 mx-auto px-4 lg:px-8 py-10">
        {/* Controls bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          {/* Time filters */}
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all border ${
                  filter === f.key
                    ? "bg-(--charcoal) text-white border-(--charcoal)"
                    : "bg-white text-(--charcoal-soft) border-black/10 hover:border-(--charcoal)"
                }`}
              >
                {f.label}
              </button>
            ))}
            {products && (
              <span className="text-[13px] text-(--charcoal-soft) ml-2">
                <strong className="text-(--charcoal)">{filtered.length}</strong> products
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: "var(--charcoal-soft)" }}>
              <Clock className="w-3.5 h-3.5" />
              Updated daily
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((p) => !p)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/10 text-[13px] font-semibold text-(--charcoal) hover:border-(--charcoal) transition-colors bg-white"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeSortLabel}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-black/10 shadow-lg z-20 min-w-47.5 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSort(opt.key); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-(--off-white) transition-colors ${sort === opt.key ? "font-bold text-(--red)" : "text-(--charcoal)"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading && <SkeletonGrid />}

        {isError && (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(51,51,51,0.15)" }} />
            <p className="text-(--charcoal-soft)">Could not load products. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(51,51,51,0.15)" }} />
            <h2 className="text-xl font-bold text-(--charcoal) mb-2">Nothing new yet</h2>
            <p className="text-(--charcoal-soft) mb-6">
              Our sellers are adding products regularly — check back soon.
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

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className="relative">
                {product.createdAt && (
                  <div
                    className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold text-white"
                    style={{ background: "var(--red)" }}
                  >
                    {timeAgo(product.createdAt)}
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
