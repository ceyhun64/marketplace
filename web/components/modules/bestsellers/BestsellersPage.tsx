"use client";

import Link from "next/link";
import { Trophy, TrendingUp, Star, ArrowRight, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

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

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 left-32 w-32 h-32 border-[16px] border-white/5 rounded-full pointer-events-none" />

        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Top Rated
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Best <span className="text-[var(--red)]">Sellers</span>
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px] mb-8">
            The products our customers love most — ranked by sales and reviews.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                  style={{
                    background: "rgba(200,16,46,0.15)",
                    color: "var(--red)",
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[var(--charcoal-soft)] uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "var(--font-body)" }}
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
      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-10">
        {/* Top 3 podium */}
        {!isLoading && !isError && products && products.length >= 3 && (
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
              {products.slice(0, 3).map((product, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const borders = [
                  "border-yellow-400/40",
                  "border-gray-300/40",
                  "border-amber-600/40",
                ];
                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl overflow-hidden border-2 ${borders[i]} relative`}
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                  >
                    <div className="absolute top-3 left-3 z-10 text-2xl">
                      {medals[i]}
                    </div>
                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--charcoal-mist)]">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Link
                        href={`/store/${product.merchantSlug}`}
                        className="font-mono text-[10px] uppercase tracking-wider text-[var(--red)] hover:underline"
                      >
                        {product.merchantStoreName}
                      </Link>
                      <h3 className="font-bold text-[var(--charcoal)] mt-1 mb-3 leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-2xl font-bold text-[var(--charcoal)]"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          ₺{product.price.toFixed(2)}
                        </span>
                        <Link
                          href={`/product/${product.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                          style={{ background: "var(--charcoal)" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                              "var(--red)")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                              "var(--charcoal)")
                          }
                        >
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All products */}
        <div className="flex items-center gap-3 mb-6">
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

        {isLoading && <SkeletonGrid />}

        {isError && (
          <div className="text-center py-20">
            <Trophy
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
            <Trophy
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "rgba(51,51,51,0.15)" }}
            />
            <h2 className="text-xl font-bold text-[var(--charcoal)] mb-2">
              No bestsellers yet
            </h2>
            <p className="text-[var(--charcoal-soft)] mb-6">
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

        {!isLoading && !isError && products && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
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
