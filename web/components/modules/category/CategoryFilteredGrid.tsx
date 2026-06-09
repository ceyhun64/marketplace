"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp, Loader2,
  Star, Check, RefreshCw, ChevronRight, Package,
} from "lucide-react";
import { useProducts, useProductTags, type ProductFilters } from "@/queries/useProducts";
import { useCart } from "@/hooks/use-cart";
import { Button }   from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch }   from "@/components/ui/switch";
import { Slider }   from "@/components/ui/slider";
import { Badge }    from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/entities";

// -- Sort options --------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest First"       },
  { value: "rating_desc", label: "Highest Rated"      },
  { value: "price_asc",   label: "Price: Low → High"  },
  { value: "price_desc",  label: "Price: High → Low"  },
];

const PRICE_MAX = 50_000;

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

// -- Skeleton card -------------------------------------------------------------

function ProductSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(51,51,51,0.07)" }}
    >
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-2.5 w-2/5 rounded-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-1/3 mt-1" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-7 flex-1 rounded-xl" />
          <Skeleton className="h-7 w-7 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// -- Filter section wrapper ----------------------------------------------------

function FilterSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.16em] flex items-center gap-2"
          style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-mono)" }}
        >
          {title}
          {count != null && count > 0 && (
            <span
              className="w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full text-white"
              style={{ background: "var(--red)" }}
            >
              {count}
            </span>
          )}
        </span>
        {open
          ? <ChevronUp  className="w-3.5 h-3.5 text-(--charcoal-mist) transition-transform" />
          : <ChevronDown className="w-3.5 h-3.5 text-(--charcoal-mist) transition-transform" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// -- Filter sidebar content ----------------------------------------------------

interface SidebarProps {
  subcategories: SubCategory[];
  filters:       ProductFilters;
  priceRange:    [number, number];
  minRating:     number;
  inStockOnly:   boolean;
  onFilter:      (key: keyof ProductFilters, v: unknown) => void;
  onPriceRange:  (r: [number, number]) => void;
  onPriceCommit: (r: [number, number]) => void;
  onRating:      (r: number) => void;
  onInStock:     (v: boolean) => void;
  onReset:       () => void;
  activeCount:   number;
}

function SidebarContent({
  subcategories, filters, priceRange, minRating, inStockOnly,
  onFilter, onPriceRange, onPriceCommit, onRating, onInStock,
  onReset, activeCount,
}: SidebarProps) {
  const { data: availTags } = useProductTags();
  const selectedTags: string[] = filters.tags ?? [];

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onFilter("tags", next.length ? next : undefined);
  };

  return (
    <div className="space-y-0 divide-y divide-(--border-subtle)">

      {/* -- Subcategories -- */}
      {subcategories.length > 0 && (
        <FilterSection title="Subcategory">
          <ul className="space-y-0.5">
            {[{ slug: undefined, name: "All", productCount: undefined }, ...subcategories].map((sub) => {
              const active = filters.subcategory === sub.slug;
              return (
                <li key={sub.slug ?? "all"}>
                  <button
                    onClick={() => onFilter("subcategory", sub.slug)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all duration-150 group"
                    style={{
                      background: active ? "var(--charcoal)" : "transparent",
                      color: active ? "#fff" : "var(--charcoal-soft)",
                      fontFamily: "var(--font-body)",
                      fontWeight: active ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(51,51,51,0.04)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="flex items-center gap-2">
                      {active && <Check className="w-3 h-3 shrink-0" />}
                      {sub.name}
                    </span>
                    {sub.productCount != null && (
                      <span className="text-[10px] tabular-nums opacity-50 font-mono">
                        {sub.productCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {/* -- Price range -- */}
      <FilterSection title="Price Range" count={
        (filters.minPrice || filters.maxPrice) ? 1 : 0
      }>
        <div className="px-1 space-y-4">
          <Slider
            min={0}
            max={PRICE_MAX}
            step={250}
            value={priceRange}
            onValueChange={(v) => onPriceRange(v as [number, number])}
            onValueCommit={(v) => onPriceCommit(v as [number, number])}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
            >
              {formatPrice(priceRange[0])}
            </span>
            <span
              className="text-[11px] font-mono"
              style={{ color: "var(--charcoal-mist)" }}
            >
              to
            </span>
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
            >
              {priceRange[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(priceRange[1])}
            </span>
          </div>
        </div>
      </FilterSection>

      {/* -- Rating -- */}
      <FilterSection title="Min Rating" count={minRating > 0 ? 1 : 0}>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((stars) => {
            const active = minRating === stars;
            return (
              <button
                key={stars}
                onClick={() => onRating(active ? 0 : stars)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-all duration-150"
                style={{
                  background: active ? "var(--charcoal)" : "transparent",
                  fontFamily: "var(--font-body)",
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(51,51,51,0.04)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3"
                      fill={i < stars ? (active ? "#fff" : "#f59e0b") : "none"}
                      stroke={i < stars ? (active ? "#fff" : "#f59e0b") : (active ? "rgba(255,255,255,0.4)" : "rgba(51,51,51,0.2)")}
                      strokeWidth={1.5}
                    />
                  ))}
                </span>
                <span style={{ color: active ? "#fff" : "var(--charcoal-soft)" }}>
                  {stars}+ stars
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* -- Availability -- */}
      <FilterSection title="Availability" count={inStockOnly ? 1 : 0}>
        <div className="flex items-center justify-between px-1">
          <span
            className="text-[13px]"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            In stock only
          </span>
          <Switch
            checked={inStockOnly}
            onCheckedChange={onInStock}
          />
        </div>
      </FilterSection>

      {/* -- Tags -- */}
      {availTags && availTags.length > 0 && (
        <FilterSection title="Tags" count={selectedTags.length}>
          <div className="flex flex-wrap gap-1.5 px-1">
            {availTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 flex items-center gap-1"
                  style={{
                    background: active ? "var(--charcoal)" : "var(--off-white)",
                    color:      active ? "#fff" : "var(--charcoal-soft)",
                    border:     `1.5px solid ${active ? "var(--charcoal)" : "rgba(51,51,51,0.12)"}`,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {active && <X className="w-2.5 h-2.5" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* -- Reset -- */}
      {activeCount > 0 && (
        <div className="pt-4">
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              border: "1.5px solid rgba(51,51,51,0.15)",
              color: "var(--charcoal)",
              background: "transparent",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--charcoal)";
              el.style.color = "#fff";
              el.style.borderColor = "var(--charcoal)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.color = "var(--charcoal)";
              el.style.borderColor = "rgba(51,51,51,0.15)";
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset all filters
            <Badge className="h-4 px-1.5 text-[9px] font-bold bg-(--red) text-white border-0 rounded-full">
              {activeCount}
            </Badge>
          </button>
        </div>
      )}
    </div>
  );
}

// -- Active filter chips -------------------------------------------------------

function ActiveChips({
  filters, subcategories, minRating, inStockOnly, priceRange,
  onFilter, onRating, onInStock, onPriceRange, onPriceCommit,
}: {
  filters: ProductFilters;
  subcategories: SubCategory[];
  minRating: number;
  inStockOnly: boolean;
  priceRange: [number, number];
  onFilter: (k: keyof ProductFilters, v: unknown) => void;
  onRating: (r: number) => void;
  onInStock: (v: boolean) => void;
  onPriceRange: (r: [number, number]) => void;
  onPriceCommit: (r: [number, number]) => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.subcategory) {
    const sub = subcategories.find((s) => s.slug === filters.subcategory);
    chips.push({ label: sub?.name ?? filters.subcategory, onRemove: () => onFilter("subcategory", undefined) });
  }
  if (filters.minPrice || filters.maxPrice)
    chips.push({
      label: `${formatPrice(priceRange[0])} – ${priceRange[1] >= PRICE_MAX ? formatPrice(PRICE_MAX) + "+" : formatPrice(priceRange[1])}`,
      onRemove: () => { onPriceRange([0, PRICE_MAX]); onPriceCommit([0, PRICE_MAX]); },
    });
  if (minRating > 0)  chips.push({ label: `${minRating}+ Stars`, onRemove: () => onRating(0) });
  if (inStockOnly)    chips.push({ label: "In stock", onRemove: () => onInStock(false) });
  (filters.tags ?? []).forEach((t) =>
    chips.push({ label: t, onRemove: () => onFilter("tags", (filters.tags ?? []).filter((x) => x !== t) || undefined) })
  );

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-[11px] font-mono text-(--charcoal-mist) uppercase tracking-wider">Active:</span>
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "var(--charcoal)", fontFamily: "var(--font-body)" }}
        >
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}

// -- Main component -------------------------------------------------------------

interface CategoryFilteredGridProps {
  slug: string;
  subcategories: SubCategory[];
}

export function CategoryFilteredGrid({ slug, subcategories }: CategoryFilteredGridProps) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const { addItem }  = useCart();

  // -- URL-driven filter state ------------------------------------------------
  const [filters, setFilters] = useState<ProductFilters>({
    page:        searchParams.get("page") ? +searchParams.get("page")! : 1,
    limit:       24,
    category:    slug,
    sort:        searchParams.get("sort") ?? "newest",
    subcategory: searchParams.get("subcategory") ?? undefined,
    minPrice:    searchParams.get("minPrice") ? +searchParams.get("minPrice")! : undefined,
    maxPrice:    searchParams.get("maxPrice") ? +searchParams.get("maxPrice")! : undefined,
    tags:        searchParams.getAll("tag").length ? searchParams.getAll("tag") : undefined,
  });

  const [priceRange,  setPriceRange]  = useState<[number, number]>([filters.minPrice ?? 0, filters.maxPrice ?? PRICE_MAX]);
  const [minRating,   setMinRating]   = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // mobile drawer
  const [sidebarOpen, setSidebarOpen] = useState(true);  // desktop sidebar

  const { data, isLoading, isFetching, isError } = useProducts(filters);

  // Client-side rating + stock filter (post-fetch, mirrors the marketplace products page)
  const rawItems: Product[] = data?.items ?? [];
  const items = rawItems
    .filter((p) => minRating === 0 || ((p as any).rating ?? 5) >= minRating)
    .filter((p) => !inStockOnly || (p.stock ?? 0) > 0);

  const totalPages = data ? Math.ceil(data.totalCount / (filters.limit ?? 24)) : 0;

  const activeCount = [
    filters.subcategory,
    filters.minPrice,
    filters.maxPrice,
    ...(filters.tags ?? []),
    minRating > 0 ? "rating" : null,
    inStockOnly ? "stock" : null,
  ].filter(Boolean).length;

  // -- Push the resulting filter state into the URL (shareable / bookmarkable) --
  const pushUrl = useCallback((next: ProductFilters) => {
    const qs = new URLSearchParams();
    if (next.sort && next.sort !== "newest") qs.set("sort", next.sort);
    if (next.subcategory)                    qs.set("subcategory", next.subcategory);
    if (next.minPrice)                       qs.set("minPrice", String(next.minPrice));
    if (next.maxPrice)                       qs.set("maxPrice", String(next.maxPrice));
    if (next.page && next.page > 1)          qs.set("page", String(next.page));
    (next.tags ?? []).forEach((t) => qs.append("tag", t));

    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname]);

  // -- Handlers ---------------------------------------------------------------

  const handleFilter = useCallback((key: keyof ProductFilters, value: unknown) => {
    setFilters((p) => {
      const next = { ...p, [key]: value, page: 1 };
      pushUrl(next);
      return next;
    });
  }, [pushUrl]);

  const handlePriceCommit = useCallback((r: [number, number]) => {
    setFilters((p) => {
      const next = {
        ...p,
        minPrice: r[0] > 0         ? r[0] : undefined,
        maxPrice: r[1] < PRICE_MAX ? r[1] : undefined,
        page: 1,
      };
      pushUrl(next);
      return next;
    });
  }, [pushUrl]);

  const handlePage = useCallback((page: number) => {
    setFilters((p) => {
      const next = { ...p, page };
      pushUrl(next);
      return next;
    });
  }, [pushUrl]);

  const handleReset = () => {
    const next: ProductFilters = { page: 1, limit: 24, category: slug, sort: "newest" };
    setFilters(next);
    setPriceRange([0, PRICE_MAX]);
    setMinRating(0);
    setInStockOnly(false);
    pushUrl(next);
  };

  const sidebarProps: SidebarProps = {
    subcategories, filters, priceRange, minRating, inStockOnly,
    onFilter:      handleFilter,
    onPriceRange:  setPriceRange,
    onPriceCommit: handlePriceCommit,
    onRating:      setMinRating,
    onInStock:     setInStockOnly,
    onReset:       handleReset,
    activeCount,
  };

  // -- Render -----------------------------------------------------------------

  return (
    <>
      {/* -- Toolbar -- */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Mobile filter trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="lg:hidden gap-2 rounded-xl font-semibold text-[13px] h-9 border-(--border-mid) text-(--charcoal)"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <span
                className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full text-white"
                style={{ background: "var(--red)" }}
              >
                {activeCount}
              </span>
            )}
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen((p) => !p)}
            className="hidden lg:flex gap-2 rounded-xl font-semibold text-[13px] h-9 border-(--border-mid) text-(--charcoal)"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {sidebarOpen ? "Hide filters" : "Filters"}
            {activeCount > 0 && (
              <span
                className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full text-white"
                style={{ background: "var(--red)" }}
              >
                {activeCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {data && (
            <p className="font-mono text-[12px]" style={{ color: "var(--charcoal-soft)" }}>
              <strong style={{ color: "var(--charcoal)" }}>{data.totalCount}</strong>{" "}
              {data.totalCount === 1 ? "product" : "products"}
              {isFetching && <Loader2 className="inline ml-1.5 w-3 h-3 animate-spin" />}
            </p>
          )}

          {/* Sort select */}
          <Select value={filters.sort ?? "newest"} onValueChange={(v) => handleFilter("sort", v)}>
            <SelectTrigger className="h-9 w-auto text-[13px] font-semibold rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveChips
        filters={filters} subcategories={subcategories} minRating={minRating} inStockOnly={inStockOnly}
        priceRange={priceRange}
        onFilter={handleFilter} onRating={setMinRating} onInStock={setInStockOnly}
        onPriceRange={setPriceRange} onPriceCommit={handlePriceCommit}
      />

      {/* -- Layout: sidebar + grid -- */}
      <div className="flex gap-8 items-start">

        {/* Desktop sidebar */}
        {sidebarOpen && (
          <aside
            className="hidden lg:block w-56 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
            style={{
              background: "#fff",
              border: "1px solid rgba(51,51,51,0.07)",
              borderRadius: "1.25rem",
              padding: "1.25rem 1rem",
            }}
          >
            <SidebarContent {...sidebarProps} />
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isError && (
            <div className="text-center py-20">
              <p className="font-semibold text-red-500 mb-3">Failed to load products.</p>
              <button
                onClick={() => router.refresh()}
                className="px-5 py-2 rounded-xl text-sm font-bold"
                style={{ background: "var(--charcoal)", color: "#fff" }}
              >
                Try again
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : !isError && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--off-white-2)" }}
              >
                <Package className="w-6 h-6" style={{ color: "var(--charcoal-mist)" }} />
              </div>
              <p className="font-bold text-base mb-2" style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}>
                No products found
              </p>
              <p className="text-[0.875rem] mb-7" style={{ color: "var(--charcoal-soft)" }}>
                Try adjusting your filters or pick a different subcategory.
              </p>
              {activeCount > 0 && (
                <Button
                  onClick={handleReset}
                  className="px-7 h-11 rounded-2xl font-bold text-sm"
                  style={{ background: "var(--charcoal)", color: "#fff" }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : !isLoading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    context="marketplace"
                    onAddToCart={() =>
                      addItem({
                        offerId: p.id,
                        productId: p.id,
                        productName: p.name,
                        productImage: p.images?.[0] ?? "",
                        merchantId: p.merchantId,
                        merchantStoreName: p.merchantStoreName,
                        merchantSlug: p.merchantSlug,
                        price: p.price,
                        stock: p.stock,
                        source: "MARKETPLACE",
                      })
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => handlePage((filters.page ?? 1) - 1)}
                    disabled={(filters.page ?? 1) <= 1}
                    className="w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all disabled:opacity-30"
                    style={{ border: "1.5px solid rgba(51,51,51,0.15)", background: "#fff", color: "var(--charcoal)" }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pg = i + 1;
                    const cur = filters.page ?? 1;
                    const active = pg === cur;
                    if (totalPages > 7 && pg > 3 && pg < totalPages - 2 && Math.abs(pg - cur) > 1)
                      return <span key={pg} className="text-(--charcoal-mist) text-sm">…</span>;
                    return (
                      <button
                        key={pg}
                        onClick={() => handlePage(pg)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                        style={{
                          background: active ? "var(--charcoal)" : "#fff",
                          color: active ? "#fff" : "var(--charcoal)",
                          border: `1.5px solid ${active ? "var(--charcoal)" : "rgba(51,51,51,0.15)"}`,
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePage((filters.page ?? 1) + 1)}
                    disabled={(filters.page ?? 1) >= totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all disabled:opacity-30"
                    style={{ border: "1.5px solid rgba(51,51,51,0.15)", background: "#fff", color: "var(--charcoal)" }}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* -- Mobile filter sheet -- */}
      <Sheet open={showFilters} onOpenChange={(o) => !o && setShowFilters(false)}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col" style={{ background: "#fff" }}>
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-(--border-light) shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-bold text-(--charcoal)">Filters</SheetTitle>
              {activeCount > 0 && (
                <button
                  onClick={() => { handleReset(); setShowFilters(false); }}
                  className="text-[12px] font-bold text-(--red) hover:opacity-70 transition-opacity"
                >
                  Reset ({activeCount})
                </button>
              )}
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <SidebarContent {...sidebarProps} />
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-(--border-light) shrink-0">
            <Button
              className="w-full h-12 rounded-2xl font-bold text-sm gap-2"
              style={{ background: "var(--charcoal)", color: "#fff" }}
              onClick={() => setShowFilters(false)}
            >
              Show {data?.totalCount ?? "–"} results
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
