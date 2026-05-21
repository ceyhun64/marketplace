"use client";

import { useState } from "react";
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

  const filtered = (products ?? [])
    .filter((p) => {
      if (!p.createdAt) return true;
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
    });

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sort";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div
          className="absolute bottom-0 left-0 w-full h-1"
          style={{
            background:
              "linear-gradient(90deg, var(--red) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-325 mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--red)]" />
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
                  Just Dropped
                </span>
              </div>
              <h1
                className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                New <span className="text-[var(--red)]">Arrivals</span>
              </h1>
              <p className="text-[var(--charcoal-soft)] text-[15px]">
                Fresh products from our sellers — updated daily.
              </p>
            </div>

            {/* Notify Me button */}
            <button
              onClick={handleNotify}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] transition-all shrink-0 ${
                notifyEnabled
                  ? "bg-[var(--red)]/20 text-[var(--red)] border border-[var(--red)]/30"
                  : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
              }`}
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
                    ? "bg-[var(--charcoal)] text-white border-[var(--charcoal)]"
                    : "bg-white text-[var(--charcoal-soft)] border-black/10 hover:border-[var(--charcoal)]"
                }`}
              >
                {f.label}
              </button>
            ))}
            {products && (
              <span className="text-[13px] text-[var(--charcoal-soft)] ml-2">
                <strong className="text-[var(--charcoal)]">{filtered.length}</strong> products
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/10 text-[13px] font-semibold text-[var(--charcoal)] hover:border-[var(--charcoal)] transition-colors bg-white"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeSortLabel}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-black/10 shadow-lg z-20 min-w-[190px] overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSort(opt.key); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--off-white)] transition-colors ${sort === opt.key ? "font-bold text-[var(--red)]" : "text-[var(--charcoal)]"}`}
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
            <p className="text-[var(--charcoal-soft)]">Could not load products. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(51,51,51,0.15)" }} />
            <h2 className="text-xl font-bold text-[var(--charcoal)] mb-2">Nothing new yet</h2>
            <p className="text-[var(--charcoal-soft)] mb-6">
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
