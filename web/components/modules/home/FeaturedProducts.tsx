"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/queries/useProducts";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/entities";

const TABS = [
  { value: "featured", label: "Featured", sort: "newest" },
  { value: "bestsellers", label: "Best Sellers", sort: "bestsellers" },
  { value: "new", label: "New Arrivals", sort: "newest" },
  { value: "deals", label: "Deals", sort: "price_asc" },
];

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("featured");

  const activeSort = TABS.find((t) => t.value === activeTab)?.sort ?? "newest";

  const { data: apiData, isLoading } = useProducts({
    limit: 8,
    sort: activeSort,
  });

  const products: Product[] = apiData?.items ?? [];

  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-325 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--charcoal-soft)]">
                Curated Selection
              </span>
            </div>
            <h2
              className="text-[2.2rem] lg:text-[2.75rem] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--charcoal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What will you <em style={{ color: "var(--red)" }}>discover</em>{" "}
              today?
            </h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors group"
            style={{ fontFamily: "var(--font-body)" }}
          >
            All Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tabs */}
        {/* overflow-x-auto + pb-1 — tabs scroll horizontally on xs if they
            don't fit; pb-1 prevents the active underline from being clipped */}
        <div
          className="flex gap-6 sm:gap-8 mb-10 border-b overflow-x-auto pb-1 -mx-1 px-1"
          style={{ borderColor: "rgba(51,51,51,0.08)", scrollbarWidth: "none" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="relative pb-4 text-sm font-semibold transition-colors duration-200 shrink-0"
              style={{
                fontFamily: "var(--font-body)",
                color:
                  activeTab === tab.value
                    ? "var(--charcoal)"
                    : "var(--charcoal-soft)",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--red)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="rounded-2xl aspect-3/4" />
              ))
            : products.length > 0
              ? products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    context="marketplace"
                  />
                ))
              : null}
        </div>

        {/* Empty state — only shown when not loading and no products returned */}
        {!isLoading && products.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="font-mono text-[12px] uppercase tracking-widest text-(--charcoal-soft)">
              No featured products at the moment. Check back soon.
            </p>
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm transition-all border border-[rgba(51,51,51,0.15)] text-(--charcoal) hover:bg-(--red) hover:border-(--red) hover:text-white min-h-11"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.02em" }}
          >
            Explore Full Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
