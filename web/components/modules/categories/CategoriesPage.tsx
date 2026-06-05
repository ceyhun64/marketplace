"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Grid3X3,
  Home,
  Search,
  Tag,
  X,
  Layers,
} from "lucide-react";
import { useCategories } from "@/queries/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types/entities";

// Accent palette — one color per category slot, cycling
const PALETTE = [
  { bg: "#fef2f2", color: "#dc2626" },
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#f0fdf4", color: "#16a34a" },
  { bg: "#fefce8", color: "#ca8a04" },
  { bg: "#faf5ff", color: "#9333ea" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#f0fdfa", color: "#0d9488" },
  { bg: "#fdf4ff", color: "#a21caf" },
  { bg: "#f0f9ff", color: "#0284c7" },
  { bg: "#fdf2f8", color: "#db2777" },
];

function accent(index: number) {
  return PALETTE[index % PALETTE.length];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-black/6 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// ── Category Card ─────────────────────────────────────────────────────────────
function CategoryCard({
  category,
  index,
  query,
}: {
  category: Category;
  index: number;
  query: string;
}) {
  const { bg, color } = accent(index);
  const subs = category.subCategories ?? [];

  // When searching, highlight matching subcategories
  const visibleSubs = query
    ? subs.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : subs.slice(0, 4);
  const extraCount = query ? 0 : Math.max(0, subs.length - 4);

  return (
    <div className="group bg-white rounded-2xl border border-black/6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Main row */}
      <Link
        href={`/category/${category.slug}`}
        className="flex items-center gap-3.5 p-5 pb-4"
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: bg }}
        >
          {category.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.iconUrl}
              alt=""
              className="w-5 h-5 object-contain"
            />
          ) : (
            <Tag className="w-4.5 h-4.5" style={{ color }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-[15px] truncate leading-tight group-hover:text-(--red) transition-colors duration-150"
            style={{ color: "var(--charcoal)" }}
          >
            {category.name}
          </h3>
          {category.productCount !== undefined && (
            <p className="text-xs mt-0.5" style={{ color: "var(--charcoal-mist)" }}>
              {category.productCount.toLocaleString()} products
            </p>
          )}
        </div>

        <ChevronRight
          className="w-4 h-4 shrink-0 group-hover:text-(--red) transition-colors duration-150"
          style={{ color: "var(--charcoal-mist)" }}
        />
      </Link>

      {/* Subcategory pills */}
      {subs.length > 0 && (
        <div
          className="px-5 pb-5 pt-3 flex flex-wrap gap-1.5"
          style={{ borderTop: "1px solid rgba(30,30,30,0.05)" }}
        >
          {visibleSubs.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug}`}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 hover:brightness-95 active:scale-95"
              style={{ background: bg, color }}
            >
              {sub.name}
            </Link>
          ))}
          {extraCount > 0 && (
            <Link
              href={`/category/${category.slug}`}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors duration-150"
              style={{
                background: "rgba(30,30,30,0.05)",
                color: "var(--charcoal-soft)",
              }}
            >
              +{extraCount} more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const rootCategories = useMemo(() => {
    const roots = (categories ?? []).filter((c) => !c.parentId);
    if (!query.trim()) return roots;

    const q = query.toLowerCase();
    return roots.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subCategories?.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [categories, query]);

  const totalProducts = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => !c.parentId)
        .reduce((sum, c) => sum + (c.productCount ?? 0), 0),
    [categories],
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 75% 50%, rgba(200,16,46,0.13) 0%, transparent 60%)",
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
            <span className="text-white font-semibold">Categories</span>
          </nav>

          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[3px]"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-jetbrains)",
              }}
            >
              Browse All
            </span>
          </div>

          <h1
            className="text-[clamp(2rem,5vw,3rem)] font-semibold text-white leading-tight mb-3"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Find What{" "}
            <span style={{ color: "var(--red-light)" }}>You&rsquo;re Looking For</span>
          </h1>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-7 flex-wrap">
            {mounted && !isLoading && !isError && (
              <>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" style={{ color: "var(--charcoal-soft)" }} />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    <span className="font-bold text-white">{rootCategories.length}</span> categories
                  </span>
                </div>
                {totalProducts > 0 && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <span className="font-bold text-white">
                        {totalProducts.toLocaleString()}
                      </span>{" "}
                      products
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--charcoal-soft)" }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories and subcategories…"
              className="w-full h-12 pl-10 pr-10 rounded-xl text-[15px] outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Error */}
        {isError && (
          <div className="text-center py-20">
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
            >
              Failed to load categories. Please try again.
            </div>
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && rootCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(30,30,30,0.05)" }}
            >
              <Search className="w-6 h-6" style={{ color: "var(--charcoal-mist)" }} />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: "var(--charcoal)" }}>
              {query ? `No results for "${query}"` : "No categories found"}
            </p>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {!isLoading && !isError && rootCategories.length > 0 && (
          <>
            {/* Result info when searching */}
            {query && (
              <p className="text-xs mb-5" style={{ color: "var(--charcoal-mist)" }}>
                {rootCategories.length} {rootCategories.length === 1 ? "category" : "categories"} for{" "}
                <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
                  &ldquo;{query}&rdquo;
                </span>
              </p>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rootCategories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} query={query} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
