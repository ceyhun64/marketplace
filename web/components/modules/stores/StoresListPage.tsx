"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Search, MapPin, Package, Star, SlidersHorizontal, ChevronDown, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { MerchantProfile } from "@/types/entities";
import { useStoreList } from "@/queries/useStore";

type SortKey = "name" | "newest" | "popular";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most Popular" },
  { key: "newest", label: "Newest" },
  { key: "name", label: "A – Z" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/5">
      <Skeleton className="h-32 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

// ── Store Card ────────────────────────────────────────────────────────────────
function StoreCard({ store }: { store: MerchantProfile }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-shadow group">
      {/* Banner */}
      <div className="h-32  relative overflow-hidden">
        {store.bannerUrl ? (
          <img
            src={store.bannerUrl}
            alt={store.storeName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-10 h-10 text-[var(--charcoal)]/10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl  border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 -mt-8 relative z-10 overflow-hidden">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-[var(--charcoal)] text-lg">
                {store.storeName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--charcoal)] text-[15px] truncate group-hover:text-[var(--red)] transition-colors">
              {store.storeName}
            </h3>
            <p className="text-[11px] font-mono text-[var(--charcoal-soft)] truncate">
              @{store.slug}
            </p>
          </div>
        </div>

        {store.description && (
          <p className="text-[13px] text-[var(--charcoal-soft)] leading-relaxed mb-4 line-clamp-2">
            {store.description}
          </p>
        )}

        <Link
          href={`/store/${store.slug}`}
          className="block w-full text-center h-9 leading-9 rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white text-[13px] font-bold transition-colors"
        >
          Visit Store
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StoresListPage() {
  const { data: stores, isLoading, isError } = useStoreList();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = (stores ?? [])
    .filter(
      (s) =>
        s.storeName.toLowerCase().includes(query.toLowerCase()) ||
        s.slug.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "name") return a.storeName.localeCompare(b.storeName);
      return 0; // API-ordered for popular/newest
    });

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sort";

  return (
    <main className="min-h-screen ">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4">
        <div className="max-w-325 mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-[var(--charcoal-mid)]" />
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
                  Independent Stores
                </span>
              </div>
              <h1
                className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                All Stores
                {!isLoading && !isError && stores && (
                  <span className="ml-4 text-[var(--red)] text-[28px] lg:text-[36px]">
                    ({filtered.length})
                  </span>
                )}
              </h1>
              <p className="text-[var(--charcoal-soft)] text-[15px]">
                Discover unique e-stores from our trusted sellers.
              </p>
            </div>

            {/* Become a Seller CTA */}
            <Link
              href="/merchant/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--red)] hover:bg-[var(--red)]/90 text-white text-[14px] font-bold transition-all shrink-0"
            >
              Open Your Store
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-md mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--charcoal-soft)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores…"
              className="pl-10 h-12 rounded-full bg-white/10 border-white/10 text-white placeholder:text-[var(--charcoal-soft)] focus-visible:ring-white/20 focus-visible:border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Stats + Sort bar */}
      {!isLoading && !isError && stores && (
        <div className="bg-white border-b border-black/5 py-3 px-4">
          <div className="max-w-325 mx-auto flex items-center justify-between text-[13px] text-[var(--charcoal-soft)]">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-[var(--charcoal)]">
                {filtered.length} stores
              </span>
              {query && (
                <span>
                  for{" "}
                  <strong className="text-[var(--red)]">"{query}"</strong>
                </span>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((p) => !p)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/10 text-[13px] font-semibold text-[var(--charcoal)] hover:border-[var(--charcoal)] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeSortLabel}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-black/10 shadow-lg z-20 min-w-[160px] overflow-hidden">
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
      )}

      {/* Grid */}
      <div className="max-w-325 mx-auto px-4 lg:px-8 py-12">
        {isError && (
          <div className="text-center py-20 text-[var(--red)] font-semibold">
            Failed to load stores. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-14 h-14 text-[var(--charcoal)]/10 mx-auto mb-4" />
            <p className="text-[var(--charcoal-soft)] text-lg font-semibold">
              {query ? `No stores match "${query}".` : "No stores found."}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {/* Become a Seller Banner */}
        {!isLoading && !isError && (
          <div className="mt-16 rounded-3xl bg-[var(--charcoal)] px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div>
              <h2 className="text-[24px] font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Ready to sell on our marketplace?
              </h2>
              <p className="text-[var(--charcoal-soft)] text-[15px]">
                Join hundreds of sellers. Set up your store in minutes — no hidden fees.
              </p>
            </div>
            <Link
              href="/merchant/register"
              className="shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--red)] hover:bg-[var(--red)]/90 text-white font-bold text-[15px] transition-all"
            >
              Become a Seller
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
