"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp, Loader2,
  Star, Check, RefreshCw, ChevronRight, Zap, Flame,
} from "lucide-react";
import { useProducts, useProductTags, type ProductFilters } from "@/queries/useProducts";
import { useCategories } from "@/queries/useCategories";
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
import type { Product, Category } from "@/types/entities";

// -- Deterministic discount % per product (decorative — no backend discount data) --
function getDiscount(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return 10 + (Math.abs(h) % 41); // 10 – 50 %
}

// Parent categories report productCount: 0 when their products live on
// subcategories rather than the parent itself — roll subcategory counts up
// so the displayed total reflects everything reachable under this category.
function effectiveProductCount(category: Category): number {
  const subs = category.subCategories ?? [];
  return (category.productCount ?? 0) + subs.reduce((sum, s) => sum + (s.productCount ?? 0), 0);
}

// -- Sort options --------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "newest",     label: "Featured"           },
  { value: "price_asc",  label: "Price: Low → High"  },
  { value: "price_desc", label: "Price: High → Low"  },
];

const PRICE_MAX = 50_000;

// -- Grid column layout options ------------------------------------------------
// Static class strings (not template literals) so Tailwind's compiler can see
// and generate them — dynamic `grid-cols-${n}` strings would be purged.
const GRID_COLS_OPTIONS = [2, 3, 4] as const;
type GridCols = (typeof GRID_COLS_OPTIONS)[number];
const GRID_COLS_CLASSES: Record<GridCols, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

// -- Stock bar -----------------------------------------------------------------
function StockBar({ stock, maxStock = 50 }: { stock?: number; maxStock?: number }) {
  if (stock === undefined) return null;
  const pct   = Math.min(100, Math.round((stock / maxStock) * 100));
  const color = pct <= 20 ? "#c8102e" : pct <= 50 ? "#d97706" : "#16a34a";
  const label =
    stock <= 0    ? "Sold Out"
    : stock <= 5  ? `Only ${stock} left!`
    : `${stock} in stock`;

  return (
    <div className="px-3.5 pb-3.5 pt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color, fontFamily: "var(--font-jetbrains)" }}
        >
          {label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--charcoal-mist)" }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(30,30,30,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// -- Flash card ----------------------------------------------------------------
function FlashCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const discount = getDiscount(product.id);
  const isHot    = product.stock !== undefined && product.stock > 0 && product.stock <= 8;

  return (
    <div
      className="relative flex flex-col overflow-hidden bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group/fc"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Discount badge */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 pointer-events-none">
        <span
          className="text-[11px] font-black px-2 py-0.5 rounded-md tracking-wide"
          style={{ background: "#c8102e", color: "white" }}
        >
          -{discount}%
        </span>
        {isHot && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5"
            style={{ background: "#d97706", color: "white" }}
          >
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
        )}
      </div>

      <ProductCard
        product={product}
        context="marketplace"
        onAddToCart={onAddToCart}
        className="shadow-none border-0 hover:shadow-none hover:translate-y-0 flex-1"
      />
      <StockBar stock={product.stock} />
    </div>
  );
}

// -- Skeleton card -------------------------------------------------------------

function FlashSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/6">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-8 w-full rounded-xl" />
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
  filters, priceRange, minRating, inStockOnly,
  onFilter, onPriceRange, onPriceCommit, onRating, onInStock,
  onReset, activeCount,
}: SidebarProps) {
  const { data: categories } = useCategories();
  const { data: availTags  } = useProductTags();

  // Gate dynamic lists behind `mounted` so SSR and the first client render
  // both produce the same markup — the query cache can already be populated
  // on the client (e.g. from the Navbar), which would otherwise mismatch the
  // server's empty-cache render and trigger a hydration error.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const rootCats = mounted ? (categories ?? []).filter((c) => !c.parentId) : [];
  const tags     = mounted ? (availTags ?? []) : [];
  const selectedTags: string[] = filters.tags ?? [];

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onFilter("tags", next.length ? next : undefined);
  };

  return (
    <div className="space-y-0 divide-y divide-(--border-subtle)">

      {/* -- Categories -- */}
      <FilterSection title="Category">
        <ul className="space-y-0.5">
          {[{ slug: undefined, name: "All Categories", count: undefined }, ...rootCats.map(c => ({ slug: c.slug, name: c.name, count: effectiveProductCount(c) }))].map((cat) => {
            const active = filters.category === cat.slug;
            return (
              <li key={cat.slug ?? "all"}>
                <button
                  onClick={() => onFilter("category", cat.slug)}
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
                    {cat.name}
                  </span>
                  {cat.count != null && (
                    <span className="text-[10px] tabular-nums opacity-50 font-mono">
                      {cat.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </FilterSection>

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
            <span className="text-[11px] font-mono" style={{ color: "var(--charcoal-mist)" }}>
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
          <Switch checked={inStockOnly} onCheckedChange={onInStock} />
        </div>
      </FilterSection>

      {/* -- Tags -- */}
      {tags.length > 0 && (
        <FilterSection title="Tags" count={selectedTags.length}>
          <div className="flex flex-wrap gap-1.5 px-1">
            {tags.map((tag) => {
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
  filters, minRating, inStockOnly, priceRange,
  onFilter, onRating, onInStock, onPriceRange, onPriceCommit,
}: {
  filters: ProductFilters;
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

  if (filters.category)
    chips.push({ label: filters.category, onRemove: () => onFilter("category", undefined) });
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

export function FlashSaleFilteredGrid() {
  const { addItem } = useCart();

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1, limit: 24, sort: "newest",
  });
  const [priceRange,  setPriceRange]  = useState<[number, number]>([0, PRICE_MAX]);
  const [minRating,   setMinRating]   = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // mobile drawer
  const [sidebarOpen, setSidebarOpen] = useState(true);  // desktop sidebar
  const [gridCols,    setGridCols]    = useState<GridCols>(4);

  const { data, isLoading, isFetching, isError } = useProducts(filters);

  // Client-side rating + stock filter (post-fetch until API supports them)
  const rawItems: Product[] = data?.items ?? [];
  const items = rawItems
    .filter((p) => minRating === 0 || ((p as any).rating ?? 5) >= minRating)
    .filter((p) => !inStockOnly || (p.stock ?? 0) > 0);

  const totalPages = data ? Math.ceil(data.totalCount / (filters.limit ?? 24)) : 0;

  const activeCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    ...(filters.tags ?? []),
    minRating > 0 ? "rating" : null,
    inStockOnly ? "stock" : null,
  ].filter(Boolean).length;

  // -- Handlers ---------------------------------------------------------------

  const handleFilter = useCallback((key: keyof ProductFilters, value: unknown) => {
    setFilters((p) => ({ ...p, [key]: value, page: 1 }));
  }, []);

  const handlePriceCommit = useCallback((r: [number, number]) => {
    setFilters((p) => ({
      ...p,
      minPrice: r[0] > 0         ? r[0] : undefined,
      maxPrice: r[1] < PRICE_MAX ? r[1] : undefined,
      page: 1,
    }));
  }, []);

  const handlePage = useCallback((page: number) => {
    setFilters((p) => ({ ...p, page }));
  }, []);

  const handleReset = () => {
    setFilters({ page: 1, limit: 24, sort: "newest" });
    setPriceRange([0, PRICE_MAX]);
    setMinRating(0);
    setInStockOnly(false);
  };

  const sidebarProps: SidebarProps = {
    filters, priceRange, minRating, inStockOnly,
    onFilter:      handleFilter,
    onPriceRange:  setPriceRange,
    onPriceCommit: handlePriceCommit,
    onRating:      setMinRating,
    onInStock:     setInStockOnly,
    onReset:       handleReset,
    activeCount,
  };

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
            {sidebarOpen ? "Hide" : "Filters"}
            {activeCount > 0 && (
              <span
                className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full text-white"
                style={{ background: "var(--red)" }}
              >
                {activeCount}
              </span>
            )}
          </Button>

          {/* Grid column-count toggle */}
          <div
            className="hidden sm:flex rounded-xl overflow-hidden"
            style={{ border: "1.5px solid rgba(51,51,51,0.12)", background: "#fff" }}
          >
            {GRID_COLS_OPTIONS.map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols)}
                className="w-9 h-9 flex items-center justify-center text-[13px] font-bold transition-all"
                style={{
                  background: gridCols === cols ? "var(--charcoal)" : "transparent",
                  color:      gridCols === cols ? "#fff" : "var(--charcoal-soft)",
                  fontFamily: "var(--font-mono)",
                }}
                aria-label={`${cols} columns`}
                aria-pressed={gridCols === cols}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {data && (
            <p className="font-mono text-[12px]" style={{ color: "var(--charcoal-soft)" }}>
              <strong style={{ color: "var(--charcoal)" }}>{data.totalCount}</strong>{" "}
              {data.totalCount === 1 ? "product" : "products"} on sale
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
        filters={filters} minRating={minRating} inStockOnly={inStockOnly}
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

        {/* Flash sale grid */}
        <div className="flex-1 min-w-0">
          {isError && (
            <div className="text-center py-20">
              <p className="font-semibold text-red-500 mb-3">Could not load products.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-xl text-sm font-bold"
                style={{ background: "var(--charcoal)", color: "#fff" }}
              >
                Try again
              </button>
            </div>
          )}

          {isLoading ? (
            <div className={`grid ${GRID_COLS_CLASSES[gridCols]} gap-4`}>
              {Array.from({ length: 12 }).map((_, i) => <FlashSkeleton key={i} />)}
            </div>
          ) : !isError && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(200,16,46,0.07)" }}
              >
                <Zap className="w-6 h-6" style={{ color: "var(--red)" }} />
              </div>
              <p className="font-bold text-base mb-2" style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}>
                No products match your filters
              </p>
              <p className="text-[0.875rem] mb-7" style={{ color: "var(--charcoal-soft)" }}>
                Try adjusting your filters or check back later.
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
              <div className={`grid ${GRID_COLS_CLASSES[gridCols]} gap-4`}>
                {items.map((p) => (
                  <FlashCard
                    key={p.id}
                    product={p}
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
