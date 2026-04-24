"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Grid3X3, Search, Tag } from "lucide-react";
import { useCategories } from "@/queries/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types/entities";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-black/5 space-y-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// ── Single Category Card ───────────────────────────────────────────────────────
function CategoryCard({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const hasChildren =
    category.subCategories && category.subCategories.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Main category link */}
      <Link
        href={`/category/${category.slug}`}
        className="flex items-center gap-4 p-5 group"
      >
        {/* Icon / colour swatch */}
        <div className="w-12 h-12 rounded-xl bg-[#F5F2EB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0D0D0D] transition-colors">
          {category.iconUrl ? (
            <img
              src={category.iconUrl}
              alt={category.name}
              className="w-6 h-6 object-contain group-hover:brightness-200"
            />
          ) : (
            <Tag className="w-5 h-5 text-[#0D0D0D]/40 group-hover:text-white transition-colors" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#0D0D0D] text-[15px] truncate group-hover:text-[#C84B2F] transition-colors">
            {category.name}
          </h3>
          {category.productCount !== undefined && (
            <p className="text-xs text-[#7A7060] mt-0.5">
              {category.productCount} products
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-[#7A7060] group-hover:text-[#C84B2F] transition-colors flex-shrink-0" />
      </Link>

      {/* Subcategories toggle */}
      {hasChildren && (
        <>
          <button
            onClick={() => setOpen((p) => !p)}
            className="w-full text-left px-5 pb-3 text-[11px] font-mono uppercase tracking-widest text-[#7A7060] hover:text-[#1A4A6B] transition-colors"
          >
            {open ? "Hide" : "Show"} subcategories (
            {category.subCategories!.length})
          </button>

          {open && (
            <ul className="border-t border-black/5 divide-y divide-black/5">
              {category.subCategories!.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/category/${sub.slug}`}
                    className="flex items-center justify-between px-5 py-3 text-[13px] text-[#0D0D0D]/70 hover:text-[#C84B2F] hover:bg-[#F5F2EB] transition-colors"
                  >
                    <span className="font-medium">{sub.name}</span>
                    {sub.productCount !== undefined && (
                      <span className="text-[11px] text-[#7A7060]">
                        {sub.productCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const [query, setQuery] = useState("");

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const rootCategories = filtered.filter((c) => !c.parentId);

  return (
    <main className="min-h-screen bg-[#F5F2EB]">
      {/* Hero bar */}
      <div className="bg-[#0D0D0D] py-14 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-4">
            <Grid3X3 className="w-4 h-4 text-[#C84B2F]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
              All Categories
            </span>
          </div>
          <h1
            className="text-[#F5F2EB] text-[36px] lg:text-[48px] leading-tight mb-6"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Browse Everything
          </h1>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7060]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter categories…"
              className="pl-10 h-12 rounded-full bg-white/10 border-white/10 text-white placeholder:text-[#7A7060] focus-visible:ring-white/20 focus-visible:border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12">
        {isError && (
          <div className="text-center py-16 text-[#C84B2F] font-semibold">
            Failed to load categories. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && rootCategories.length === 0 && (
          <div className="text-center py-20 text-[#7A7060]">
            {query ? `No categories match "${query}".` : "No categories found."}
          </div>
        )}

        {!isLoading && !isError && rootCategories.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rootCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
