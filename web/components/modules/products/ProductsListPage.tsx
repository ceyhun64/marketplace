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
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/entities";

// ── Helpers ────────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

// ── Product Card ───────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-all group block"
    >
      {/* Image */}
      <div className="aspect-square  overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[#0D0D0D]/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.merchantStoreName && (
          <p className="text-[10px] font-mono font-bold text-[#1A4A6B] uppercase tracking-wider mb-1 truncate">
            {product.merchantStoreName}
          </p>
        )}
        <h3 className="font-bold text-[#0D0D0D] text-[14px] leading-snug mb-2 line-clamp-2 group-hover:text-[#C84B2F] transition-colors">
          {product.name}
        </h3>
        {product.categoryName && (
          <p className="text-[11px] text-[#7A7060] mb-3">
            {product.categoryName}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span
            className="text-[18px] font-bold text-[#0D0D0D]"
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
      </div>
    </Link>
  );
}

// ── Product Skeleton ───────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/5">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

// ── Filter Sidebar ─────────────────────────────────────────────────────────────
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
      {/* Categories */}
      <div>
        <h3 className="font-bold text-[#0D0D0D] text-[13px] mb-3 uppercase tracking-widest font-mono">
          Category
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onFilterChange("category", undefined)}
              className={`w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors ${
                !filters.category
                  ? "bg-[#0D0D0D] text-white font-bold"
                  : "text-[#7A7060] hover: hover:text-[#0D0D0D]"
              }`}
            >
              All Categories
            </button>
          </li>
          {rootCategories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onFilterChange("category", cat.slug)}
                className={`w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors ${
                  filters.category === cat.slug
                    ? "bg-[#0D0D0D] text-white font-bold"
                    : "text-[#7A7060] hover: hover:text-[#0D0D0D]"
                }`}
              >
                {cat.name}
                {cat.productCount !== undefined && (
                  <span className="float-right text-[11px] opacity-60">
                    {cat.productCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-[#0D0D0D] text-[13px] mb-3 uppercase tracking-widest font-mono">
          Price Range
        </h3>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onFilterChange(
                "minPrice",
                e.target.value ? +e.target.value : undefined,
              )
            }
            className="h-9 text-sm rounded-lg"
          />
          <span className="text-[#7A7060] text-sm flex-shrink-0">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onFilterChange(
                "maxPrice",
                e.target.value ? +e.target.value : undefined,
              )
            }
            className="h-9 text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        onClick={onReset}
        className="w-full rounded-full border-[#0D0D0D] text-[13px] font-bold"
      >
        Reset Filters
      </Button>
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
    <main className="min-h-screen ">
      {/* Top bar */}
      <div className="bg-[#0D0D0D] py-10 px-4">
        <div className="max-w-[1200px] mx-auto">
          <h1
            className="text-[#F5F2EB] text-[32px] lg:text-[44px] leading-tight mb-4"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            All Products
          </h1>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7060]" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="pl-10 h-12 rounded-full bg-white/10 border-white/10 text-white placeholder:text-[#7A7060] focus-visible:ring-white/20 focus-visible:border-white/30"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    handleFilterChange("search", undefined);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7060] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="h-12 px-6 rounded-full bg-[#C84B2F] hover:bg-[#a83a20] text-white font-bold"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-black/10 text-[13px] font-bold hover:border-black/30 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-[#C84B2F] text-white rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </button>

            {filters.category && (
              <button
                onClick={() => handleFilterChange("category", undefined)}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-[#0D0D0D] text-white text-[12px] font-semibold"
              >
                {filters.category}
                <X className="w-3 h-3" />
              </button>
            )}

            {filters.search && (
              <button
                onClick={() => {
                  setSearchInput("");
                  handleFilterChange("search", undefined);
                }}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-[#C84B2F] text-white text-[12px] font-semibold"
              >
                "{filters.search}"
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {data && (
              <p className="text-[13px] text-[#7A7060]">
                <strong className="text-[#0D0D0D]">{data.totalCount}</strong>{" "}
                products
                {isFetching && (
                  <Loader2 className="inline ml-2 w-3 h-3 animate-spin text-[#7A7060]" />
                )}
              </p>
            )}

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort ?? "newest"}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="h-9 pl-3 pr-8 rounded-full border border-black/10 bg-white text-[13px] font-semibold appearance-none focus:outline-none focus:border-black/30 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7060] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          {showFilters && (
            <div className="w-56 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isError && (
              <div className="text-center py-20 text-[#C84B2F] font-semibold">
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
                <ShoppingBag className="w-14 h-14 text-[#0D0D0D]/10 mx-auto mb-4" />
                <p className="text-[#7A7060] text-lg font-semibold mb-2">
                  No products found
                </p>
                <p className="text-[#7A7060] text-sm mb-6">
                  Try adjusting your filters or search term.
                </p>
                <Button
                  onClick={handleReset}
                  className="rounded-full bg-[#0D0D0D] text-white font-bold"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {!isLoading && !isError && (data?.items ?? []).length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data!.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleFilterChange("page", (filters.page ?? 1) - 1)
                      }
                      disabled={(filters.page ?? 1) <= 1}
                      className="rounded-full border-[#0D0D0D] font-bold"
                    >
                      Previous
                    </Button>

                    <span className="text-[13px] text-[#7A7060] px-4">
                      Page {filters.page ?? 1} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() =>
                        handleFilterChange("page", (filters.page ?? 1) + 1)
                      }
                      disabled={(filters.page ?? 1) >= totalPages}
                      className="rounded-full border-[#0D0D0D] font-bold"
                    >
                      Next
                    </Button>
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
