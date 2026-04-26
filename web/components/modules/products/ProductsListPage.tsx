"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useProducts, type ProductFilters } from "@/queries/useProducts";
import { useCategories } from "@/queries/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/entities";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group bg-white block transition-all duration-300 hover:-translate-y-1"
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(51,51,51,0.08)",
        boxShadow: "0 1px 3px rgba(51,51,51,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Red accent top */}
      <div
        className="h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: "#c8102e" }}
      />
      {/* Image */}
      <div
        className="aspect-square overflow-hidden"
        style={{ background: "#f5f5f3" }}
      >
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag
              className="w-10 h-10"
              style={{ color: "rgba(51,51,51,0.1)" }}
            />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        {product.merchantStoreName && (
          <p
            className="font-mono text-[10px] uppercase tracking-[0.12em] mb-1 truncate"
            style={{ color: "#c8102e" }}
          >
            {product.merchantStoreName}
          </p>
        )}
        <h3
          className="font-bold text-[14px] leading-snug mb-2 line-clamp-2 text-[#333333] group-hover:text-[#c8102e] transition-colors"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {product.name}
        </h3>
        {product.categoryName && (
          <p className="font-mono text-[11px] text-[#6b6b6b] mb-3 uppercase tracking-[0.08em]">
            {product.categoryName}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span
            className="text-[18px] font-bold text-[#333333]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            ₺{product.price.toFixed(2)}
          </span>
          {product.stock !== undefined && product.stock <= 5 && (
            <span
              className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: "#c8102e",
                background: "rgba(200,16,46,0.08)",
                letterSpacing: "0.05em",
              }}
            >
              {product.stock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(51,51,51,0.08)" }}
    >
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: unknown) => void;
  onReset: () => void;
}

function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
}: FilterSidebarProps) {
  const { data: categories } = useCategories();
  const rootCategories = (categories ?? []).filter((c) => !c.parentId);

  return (
    <aside className="space-y-6">
      <div>
        <h3
          className="font-mono text-[11px] uppercase tracking-[0.15em] mb-3"
          style={{ color: "#6b6b6b" }}
        >
          Category
        </h3>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => onFilterChange("category", undefined)}
              className="w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors"
              style={{
                background: !filters.category ? "#333333" : "transparent",
                color: !filters.category ? "#fff" : "#6b6b6b",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: !filters.category ? 600 : 400,
              }}
            >
              All Categories
            </button>
          </li>
          {rootCategories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onFilterChange("category", cat.slug)}
                className="w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors"
                style={{
                  background:
                    filters.category === cat.slug ? "#333333" : "transparent",
                  color: filters.category === cat.slug ? "#fff" : "#6b6b6b",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: filters.category === cat.slug ? 600 : 400,
                }}
              >
                {cat.name}
                {cat.productCount !== undefined && (
                  <span className="float-right text-[11px] opacity-50">
                    {cat.productCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3
          className="font-mono text-[11px] uppercase tracking-[0.15em] mb-3"
          style={{ color: "#6b6b6b" }}
        >
          Price Range
        </h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onFilterChange(
                "minPrice",
                e.target.value ? +e.target.value : undefined,
              )
            }
            className="h-9 w-full text-sm rounded-lg px-3 outline-none"
            style={{
              border: "1.5px solid rgba(51,51,51,0.15)",
              background: "#f5f5f3",
              color: "#333333",
              fontFamily: "'Manrope', sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#c8102e";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(51,51,51,0.15)";
              e.currentTarget.style.background = "#f5f5f3";
            }}
          />
          <span className="text-[#6b6b6b] text-sm flex-shrink-0">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onFilterChange(
                "maxPrice",
                e.target.value ? +e.target.value : undefined,
              )
            }
            className="h-9 w-full text-sm rounded-lg px-3 outline-none"
            style={{
              border: "1.5px solid rgba(51,51,51,0.15)",
              background: "#f5f5f3",
              color: "#333333",
              fontFamily: "'Manrope', sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#c8102e";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(51,51,51,0.15)";
              e.currentTarget.style.background = "#f5f5f3";
            }}
          />
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
        style={{
          border: "1.5px solid rgba(51,51,51,0.15)",
          color: "#333333",
          background: "transparent",
          fontFamily: "'Manrope', sans-serif",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#333333";
          el.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.color = "#333333";
        }}
      >
        Reset Filters
      </button>
    </aside>
  );
}

export default function ProductsListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 24,
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") ?? "newest",
    minPrice: searchParams.get("minPrice")
      ? +searchParams.get("minPrice")!
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? +searchParams.get("maxPrice")!
      : undefined,
  });

  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const { data, isLoading, isFetching, isError } = useProducts(filters);

  const handleFilterChange = useCallback(
    (key: keyof ProductFilters, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    [],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", searchInput.trim() || undefined);
  };

  const handleReset = () => {
    setFilters({ page: 1, limit: 24, sort: "newest" });
    setSearchInput("");
  };

  const totalPages = data
    ? Math.ceil(data.totalCount / (filters.limit ?? 24))
    : 0;
  const activeFilterCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen" style={{ background: "#f5f5f3" }}>
      {/* Header */}
      <div
        style={{
          background: "#333333",
          padding: "3rem 1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="absolute top-[-60px] right-[-60px] w-[220px] h-[220px] rounded-full pointer-events-none"
          style={{ border: "40px solid rgba(200,16,46,0.08)" }}
        />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "#c8102e" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Catalogue
            </span>
          </div>
          <h1
            className="font-normal leading-tight mb-6 text-white"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
            }}
          >
            All <em style={{ color: "#c8102e" }}>Products</em>
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10 pr-10 h-12 rounded-lg text-sm outline-none text-white"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  fontFamily: "'Manrope', sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c8102e";
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    handleFilterChange("search", undefined);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{
                background: "#c8102e",
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#a00d24")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#c8102e")
              }
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: "#fff",
                border: "1.5px solid rgba(51,51,51,0.15)",
                color: "#333333",
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#333333";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(51,51,51,0.15)";
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="h-5 w-5 flex items-center justify-center text-[10px] font-mono text-white rounded-full"
                  style={{ background: "#c8102e" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filters.category && (
              <button
                onClick={() => handleFilterChange("category", undefined)}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold text-white"
                style={{ background: "#333333" }}
              >
                {filters.category} <X className="w-3 h-3" />
              </button>
            )}
            {filters.search && (
              <button
                onClick={() => {
                  setSearchInput("");
                  handleFilterChange("search", undefined);
                }}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold text-white"
                style={{ background: "#c8102e" }}
              >
                "{filters.search}" <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {data && (
              <p className="font-mono text-[12px]" style={{ color: "#6b6b6b" }}>
                <strong style={{ color: "#333333" }}>{data.totalCount}</strong>{" "}
                products
                {isFetching && (
                  <Loader2 className="inline ml-2 w-3 h-3 animate-spin" />
                )}
              </p>
            )}
            <div className="relative">
              <select
                value={filters.sort ?? "newest"}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg text-[13px] font-semibold appearance-none outline-none cursor-pointer"
                style={{
                  border: "1.5px solid rgba(51,51,51,0.15)",
                  background: "#fff",
                  color: "#333333",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "#6b6b6b" }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {showFilters && (
            <div className="w-56 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isError && (
              <div
                className="text-center py-20 font-semibold"
                style={{ color: "#c8102e" }}
              >
                Failed to load products. Please try again.
              </div>
            )}
            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 24 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            )}
            {!isLoading && !isError && (data?.items ?? []).length === 0 && (
              <div className="text-center py-20">
                <ShoppingBag
                  className="w-14 h-14 mx-auto mb-4"
                  style={{ color: "rgba(51,51,51,0.1)" }}
                />
                <p
                  className="font-bold text-lg mb-2"
                  style={{
                    color: "#333333",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  No products found
                </p>
                <p
                  className="text-[0.875rem] mb-6"
                  style={{ color: "#6b6b6b" }}
                >
                  Try adjusting your filters or search term.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-lg text-sm font-semibold text-white"
                  style={{
                    background: "#333333",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
            {!isLoading && !isError && (data?.items ?? []).length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data!.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                      onClick={() =>
                        handleFilterChange("page", (filters.page ?? 1) - 1)
                      }
                      disabled={(filters.page ?? 1) <= 1}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                      style={{
                        border: "1.5px solid rgba(51,51,51,0.15)",
                        color: "#333333",
                        background: "#fff",
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Previous
                    </button>
                    <span
                      className="font-mono text-[12px]"
                      style={{ color: "#6b6b6b" }}
                    >
                      Page {filters.page ?? 1} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handleFilterChange("page", (filters.page ?? 1) + 1)
                      }
                      disabled={(filters.page ?? 1) >= totalPages}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                      style={{
                        border: "1.5px solid rgba(51,51,51,0.15)",
                        color: "#333333",
                        background: "#fff",
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
