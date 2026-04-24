"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Tag,
  Clock,
  ShoppingBag,
  ChevronRight,
  TrendingDown,
  Star,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/entities";

// ── Query — featured (deals) products ─────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/5">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

// ── Deal Card ─────────────────────────────────────────────────────────────────
function DealCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-lg transition-all group block"
    >
      {/* Image */}
      <div className="aspect-square bg-[#F5F2EB] relative overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[#0D0D0D]/15" />
          </div>
        )}

        {/* Deal badge */}
        <div className="absolute top-3 left-3 bg-[#C84B2F] text-white text-[10px] font-bold font-mono px-2 py-1 rounded-full flex items-center gap-1">
          <Zap className="w-3 h-3" />
          DEAL
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.merchantStoreName && (
          <p className="text-[10px] font-mono font-bold text-[#1A4A6B] uppercase tracking-wider mb-1 truncate">
            {product.merchantStoreName}
          </p>
        )}
        <h3 className="font-bold text-[#0D0D0D] text-[14px] leading-snug mb-3 line-clamp-2 group-hover:text-[#C84B2F] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span
            className="text-[20px] font-bold text-[#0D0D0D]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            ₺{product.price.toFixed(2)}
          </span>
          {product.stock !== undefined && product.stock <= 5 && (
            <span className="text-[10px] font-bold text-[#C84B2F] bg-[#C84B2F]/10 px-2 py-0.5 rounded-full">
              {product.stock} left
            </span>
          )}
        </div>

        <div className="mt-3 h-9 leading-9 text-center rounded-full bg-[#0D0D0D] group-hover:bg-[#C84B2F] text-white text-[12px] font-bold transition-colors">
          View Deal
        </div>
      </div>
    </Link>
  );
}

// ── Filter Tab ─────────────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const { data: products, isLoading, isError } = useDealsProducts();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const filtered = (products ?? []).filter((p) => {
    if (activeFilter === "lowstock")
      return p.stock !== undefined && p.stock <= 10;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#F5F2EB]">
      {/* Hero */}
      <div className="bg-[#0D0D0D] py-14 px-4 relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[#C84B2F]/10 rounded-full" />
        <div className="absolute -bottom-16 left-32 w-32 h-32 border-[16px] border-[#1A4A6B]/15 rounded-full" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#C84B2F]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
              Best Offers
            </span>
          </div>
          <h1
            className="text-[#F5F2EB] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Today&apos;s{" "}
            <span className="text-[#C84B2F]">Deals</span>
          </h1>
          <p className="text-[#7A7060] text-[15px] mb-8">
            Hand-picked offers from our top sellers. Don't miss out.
          </p>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                  activeFilter === f.key
                    ? "bg-[#C84B2F] text-white"
                    : "bg-white/10 text-[#7A7060] hover:bg-white/20 hover:text-white"
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
      <div className="bg-[#1A4A6B] text-white py-3 px-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between text-[13px]">
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
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12">
        {isError && (
          <div className="text-center py-20 text-[#C84B2F] font-semibold">
            Failed to load deals. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20">
            <Tag className="w-14 h-14 text-[#0D0D0D]/10 mx-auto mb-4" />
            <p className="text-[#7A7060] text-lg font-semibold">
              No deals found for this filter.
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <p className="text-[13px] text-[#7A7060] mb-6">
              <strong className="text-[#0D0D0D]">{filtered.length}</strong>{" "}
              deals available
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <DealCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
