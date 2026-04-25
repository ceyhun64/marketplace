"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Search, MapPin, Package, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { MerchantProfile } from "@/types/entities";

// ── Query ─────────────────────────────────────────────────────────────────────
function useStoreList() {
  return useQuery({
    queryKey: ["stores", "list"],
    queryFn: async () => {
      const { data } = await api.get<unknown>("/api/store/list");
      // API may return a paged wrapper { items: [...] } or a plain array
      if (Array.isArray(data)) return data as MerchantProfile[];
      const paged = data as {
        items?: MerchantProfile[];
        data?: MerchantProfile[];
      };
      return (paged.items ?? paged.data ?? []) as MerchantProfile[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

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
            <Store className="w-10 h-10 text-[#0D0D0D]/10" />
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
              <span className="font-bold text-[#0D0D0D] text-lg">
                {store.storeName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#0D0D0D] text-[15px] truncate group-hover:text-[#C84B2F] transition-colors">
              {store.storeName}
            </h3>
            <p className="text-[11px] font-mono text-[#7A7060] truncate">
              @{store.slug}
            </p>
          </div>
        </div>

        {store.description && (
          <p className="text-[13px] text-[#7A7060] leading-relaxed mb-4 line-clamp-2">
            {store.description}
          </p>
        )}

        <Link
          href={`/store/${store.slug}`}
          className="block w-full text-center h-9 leading-9 rounded-full bg-[#0D0D0D] hover:bg-[#C84B2F] text-white text-[13px] font-bold transition-colors"
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

  const filtered = (stores ?? []).filter(
    (s) =>
      s.storeName.toLowerCase().includes(query.toLowerCase()) ||
      s.slug.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="min-h-screen ">
      {/* Hero */}
      <div className="bg-[#0D0D0D] py-14 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-[#1A4A6B]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
              Independent Stores
            </span>
          </div>
          <h1
            className="text-[#F5F2EB] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            All Stores
          </h1>
          <p className="text-[#7A7060] text-[15px] mb-6">
            Discover unique e-stores from our trusted sellers.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7060]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores…"
              className="pl-10 h-12 rounded-full bg-white/10 border-white/10 text-white placeholder:text-[#7A7060] focus-visible:ring-white/20 focus-visible:border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {!isLoading && !isError && stores && (
        <div className="bg-white border-b border-black/5 py-3 px-4">
          <div className="max-w-[1200px] mx-auto flex items-center gap-6 text-[13px] text-[#7A7060]">
            <span className="font-semibold text-[#0D0D0D]">
              {filtered.length} stores
            </span>
            {query && (
              <span>
                showing results for{" "}
                <strong className="text-[#C84B2F]">"{query}"</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12">
        {isError && (
          <div className="text-center py-20 text-[#C84B2F] font-semibold">
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
            <Store className="w-14 h-14 text-[#0D0D0D]/10 mx-auto mb-4" />
            <p className="text-[#7A7060] text-lg font-semibold">
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
      </div>
    </main>
  );
}
