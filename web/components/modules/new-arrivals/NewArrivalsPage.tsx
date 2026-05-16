"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
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

        <div className="max-w-[1300px] mx-auto relative z-10">
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
      </div>

      {/* Content */}
      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red)" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--charcoal-soft)" }}
            >
              {products
                ? `${products.length} New Products`
                : "Latest Additions"}
            </span>
          </div>
          <div
            className="flex items-center gap-2 font-mono text-[11px]"
            style={{ color: "var(--charcoal-soft)" }}
          >
            <Clock className="w-3.5 h-3.5" />
            Updated daily
          </div>
        </div>

        {isLoading && <SkeletonGrid />}

        {isError && (
          <div className="text-center py-20">
            <Sparkles
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "rgba(51,51,51,0.15)" }}
            />
            <p className="text-[var(--charcoal-soft)]">
              Could not load products. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && products && products.length === 0 && (
          <div className="text-center py-20">
            <Sparkles
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "rgba(51,51,51,0.15)" }}
            />
            <h2 className="text-xl font-bold text-[var(--charcoal)] mb-2">
              Nothing new yet
            </h2>
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

        {!isLoading && !isError && products && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
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
