"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  LayoutGrid,
  List,
  Tag,
  Store,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
  Package,
  RefreshCw,
  Wifi,
  Heart,
  ArrowUpDown,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useHybridWishlist } from "@/hooks/use-hybrid-wishlist";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { ProductCard as SharedProductCard } from "@/components/modules/store/ProductCard";

// --- Types --------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  merchantId: string;
  merchantStoreName: string;
  merchantSlug: string;
  tags: string[];
  isApproved: boolean;
  isDeleted: boolean;
  publishToMarket: boolean;
  publishToStore: boolean;
  createdAt: string;
  score?: number;
  highlights?: { name?: string[]; description?: string[]; tags?: string[] };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  productCount?: number;
}

interface SearchFacets {
  categories: { key: string; name: string; count: number }[];
  priceRanges: { label: string; min: number; max: number; count: number }[];
  tags: { key: string; count: number }[];
  merchants: { key: string; name: string; count: number }[];
}

interface SearchResult {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  facets?: SearchFacets;
  queryTime?: number;
  suggestion?: string;
}

type SortOption = "relevance" | "price_asc" | "price_desc" | "newest" | "popular";
type ViewMode = "grid" | "list";

// --- Constants ----------------------------------------------------------------

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "relevance",  label: "Most Relevant",    icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: "newest",     label: "Newest First",     icon: <Clock className="w-3.5 h-3.5" /> },
  { value: "popular",    label: "Most Popular",     icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: "price_asc",  label: "Price: Low → High",icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
  { value: "price_desc", label: "Price: High → Low",icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
];

const PRICE_PRESETS = [
  { label: "Under $100",         min: 0,    max: 100   },
  { label: "$100 – $500",        min: 100,  max: 500   },
  { label: "$500 – $1,000",      min: 500,  max: 1000  },
  { label: "$1,000 – $5,000",    min: 1000, max: 5000  },
  { label: "$5,000+",            min: 5000, max: 999999},
];

// --- Highlight Helper ---------------------------------------------------------

function Highlighted({ text, parts }: { text: string; parts?: string[] }) {
  if (!parts?.length) return <>{text}</>;
  const raw = parts[0];
  const segments = raw.split(/(<em>.*?<\/em>)/g);
  return (
    <>
      {segments.map((s, i) =>
        s.startsWith("<em>") ? (
          <mark
            key={i}
            className="rounded-sm px-0.5"
            style={{ background: "var(--red-muted)", color: "var(--red)", fontWeight: 600 }}
          >
            {s.slice(4, -5)}
          </mark>
        ) : (
          <span key={i}>{s}</span>
        ),
      )}
    </>
  );
}

// --- Search List Card (list-view only; grid view uses shared ProductCard) --------

function SearchListCard({ product }: { product: Product }) {
  const href = `/product/${product.id}`;
  const cover = product.images?.[0] ?? null;
  const outOfStock = product.stock === 0;
  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const cart = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useHybridWishlist();
  const inWishlist = isInWishlist(product.id);

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    cart.addItem({
      offerId:           product.id,
      productId:         product.id,
      productName:       product.name,
      productImage:      product.images?.[0],
      price:             product.price,
      merchantId:        product.merchantId,
      merchantStoreName: product.merchantStoreName,
      merchantSlug:      product.merchantSlug,
      stock:             product.stock,
    });
    toast.success("Added to cart", { description: product.name, duration: 2000 });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id, {
      productName:  product.name,
      productImage: product.images?.[0],
      price:        product.price,
    });
  };

  return (
    <Link href={href} className="group block">
      <div className="flex gap-4 bg-white rounded-2xl p-4 border border-(--border-light) transition-all hover:border-(--red)/30 hover:shadow-md">
        {/* Image */}
        <div
          className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden"
          style={{ background: "var(--off-white-2)" }}
        >
          {cover ? (
            <img
              src={cover}
              alt={product.name}
              className="w-full h-full object-cover"
              style={{ filter: outOfStock ? "grayscale(50%) opacity(0.7)" : "none" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8" style={{ color: "var(--charcoal-mist)" }} />
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <span
                className="text-[9px] font-black tracking-widest border rounded px-1.5 py-0.5"
                style={{ color: "var(--charcoal-soft)", borderColor: "var(--charcoal-soft)" }}
              >
                OUT OF STOCK
              </span>
            </div>
          )}
          {discountPct > 0 && (
            <div
              className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--red)", color: "#fff" }}
            >
              -{discountPct}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Tag className="w-3 h-3 shrink-0" style={{ color: "var(--red)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--red)" }}>
              {product.categoryName}
            </span>
          </div>
          <h3 className="font-semibold leading-snug mb-1.5 line-clamp-2" style={{ fontSize: 14, color: "var(--charcoal)" }}>
            <Highlighted text={product.name} parts={product.highlights?.name} />
          </h3>
          <p className="text-[12px] leading-relaxed line-clamp-2 mb-2" style={{ color: "var(--charcoal-soft)" }}>
            <Highlighted text={product.description} parts={product.highlights?.description} />
          </p>
          {product.merchantStoreName && (
            <div className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--charcoal-mist)" }}>
              <Store className="w-3 h-3 shrink-0" />
              {product.merchantStoreName}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col items-end justify-between shrink-0 min-w-25">
          <div className="text-right">
            {product.oldPrice && product.oldPrice > product.price && (
              <div className="text-[11px] line-through mb-0.5" style={{ color: "var(--charcoal-mist)" }}>
                {formatPrice(product.oldPrice)}
              </div>
            )}
            <div className="font-bold tabular-nums" style={{ fontSize: 18, color: "var(--charcoal)" }}>
              {formatPrice(product.price)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <button
              onClick={handleWishlist}
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:bg-red-50 hover:border-(--red)"
              style={{
                borderColor: inWishlist ? "var(--red)" : "var(--border-light)",
                background:  inWishlist ? "var(--red-muted)" : "transparent",
              }}
              aria-label="Wishlist"
            >
              <Heart
                className="w-3.5 h-3.5"
                fill={inWishlist ? "var(--red)" : "none"}
                style={{ color: inWishlist ? "var(--red)" : "var(--charcoal-soft)" }}
              />
            </button>
            <button
              onClick={handleCart}
              disabled={outOfStock}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-[12px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: outOfStock ? "var(--charcoal-mist)" : "var(--red)", fontFamily: "var(--font-body)" }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- Skeleton -----------------------------------------------------------------

function CardSkeleton({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="flex gap-4 bg-white rounded-2xl p-4 border border-(--border-light) animate-pulse">
        <div className="w-28 h-28 shrink-0 rounded-xl bg-(--off-white-2)" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-24 bg-(--off-white-2) rounded-full" />
          <div className="h-4 w-3/4 bg-(--off-white-2) rounded" />
          <div className="h-3 w-full bg-(--off-white-2) rounded" />
          <div className="h-3 w-2/3 bg-(--off-white-2) rounded" />
        </div>
        <div className="flex flex-col justify-between items-end shrink-0 w-24">
          <div className="h-5 w-16 bg-(--off-white-2) rounded" />
          <div className="h-9 w-20 bg-(--off-white-2) rounded-xl" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-(--border-light) animate-pulse">
      <div className="aspect-square bg-(--off-white-2)" />
      <div className="p-3.5 space-y-2">
        <div className="h-2.5 w-16 bg-(--off-white-2) rounded-full" />
        <div className="h-3.5 w-4/5 bg-(--off-white-2) rounded" />
        <div className="h-3.5 w-2/3 bg-(--off-white-2) rounded" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-14 bg-(--off-white-2) rounded" />
          <div className="w-9 h-9 bg-(--off-white-2) rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// --- Filter Accordion ---------------------------------------------------------

function FilterAccordion({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-(--border-subtle) pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between pb-3 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--charcoal)", fontFamily: "var(--font-mono)" }}>
            {title}
          </span>
          {count != null && count > 0 && (
            <span
              className="text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--red)" }}
            >
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{
            color: "var(--charcoal-mist)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// --- Filter button ------------------------------------------------------------

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-100"
      style={{
        background: active ? "var(--red-muted)" : "transparent",
        color: active ? "var(--red)" : "var(--charcoal-soft)",
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--off-white-2)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

// --- Main Component -----------------------------------------------------------

export default function SearchPage() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state
  const q         = searchParams.get("q") || "";
  const category  = searchParams.get("category") || "";
  const minPrice  = searchParams.get("minPrice") || "";
  const maxPrice  = searchParams.get("maxPrice") || "";
  const tags      = searchParams.get("tags") || "";
  const sort      = (searchParams.get("sort") || "relevance") as SortOption;
  const page      = parseInt(searchParams.get("page") || "1");

  // UI state
  const [inputValue,       setInputValue]       = useState(q);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("search-view-mode") as ViewMode) ?? "grid";
  });
  const [mobileFiltersOpen,setMobileFiltersOpen] = useState(false);
  const [minPriceInput,    setMinPriceInput]    = useState(minPrice);
  const [maxPriceInput,    setMaxPriceInput]    = useState(maxPrice);
  const [showSortMenu,     setShowSortMenu]     = useState(false);

  // Data state
  const [results,    setResults]    = useState<SearchResult | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offline,    setOffline]    = useState(false);

  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortMenuRef    = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const { addItem }    = useCart();

  // -- URL builder ------------------------------------------------------------
  const buildUrl = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      const cur = { q, category, minPrice, maxPrice, tags, sort, page: String(page), ...overrides };
      Object.entries(cur).forEach(([k, v]) => {
        const s = String(v ?? "");
        if (!s || s === "0" || (k === "page" && s === "1")) return;
        params.set(k, s);
      });
      if (cur.q) params.set("q", String(cur.q));
      return `${pathname}?${params.toString()}`;
    },
    [q, category, minPrice, maxPrice, tags, sort, page, pathname],
  );

  const navigate = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      startTransition(() => { router.push(buildUrl(overrides)); });
    },
    [buildUrl, router],
  );

  // -- Fetch ------------------------------------------------------------------
  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffline(false);
    try {
      const p = new URLSearchParams();
      if (q)        p.set("q", q);
      if (category) p.set("category", category);
      if (minPrice) p.set("minPrice", minPrice);
      if (maxPrice) p.set("maxPrice", maxPrice);
      if (tags)     p.set("tags", tags);
      if (sort && sort !== "relevance") p.set("sort", sort);
      p.set("page", String(page));
      p.set("limit", "20");

      const res  = await fetch(`/api/products/search?${p.toString()}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();

      const rawItems: any[] = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
      const products: Product[] = rawItems.map((p: any) => ({
        id:                p.id ?? "",
        merchantId:        p.merchantId ?? "",
        merchantStoreName: p.merchantStoreName ?? p.merchant?.storeName ?? "",
        merchantSlug:      p.merchantSlug ?? p.merchant?.slug ?? "",
        name:              p.name ?? "",
        description:       p.description ?? "",
        categoryId:        p.categoryId ?? "",
        categoryName:      p.categoryName ?? p.category?.name ?? "",
        images:            p.images ?? [],
        tags:              p.tags ?? [],
        price:             p.price ?? 0,
        oldPrice:          p.oldPrice ?? undefined,
        stock:             p.stock ?? 0,
        publishToMarket:   p.publishToMarket ?? true,
        publishToStore:    p.publishToStore ?? true,
        isApproved:        p.isApproved ?? true,
        isDeleted:         p.isDeleted ?? false,
        createdAt:         p.createdAt ?? "",
        score:             p._score ?? p.score,
        highlights:        p.highlight ?? p.highlights,
      }));

      setResults({
        items:      products,
        total:      data?.total ?? data?.Total ?? products.length,
        page:       data?.page ?? page,
        totalPages: data?.totalPages ?? Math.ceil((data?.total ?? products.length) / 20),
        facets:     data?.facets,
        queryTime:  data?.took ?? data?.queryTime,
        suggestion: data?.suggestion,
      });
    } catch (err) {
      if (!navigator.onLine) setOffline(true);
      setError(err instanceof Error ? err.message : "Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, tags, sort, page]);

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats: Category[] = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        setCategories(cats.filter((c) => !c.parentId));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Sync input with URL
  useEffect(() => { setInputValue(q); }, [q]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Debounced input
  const handleInput = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { navigate({ q: val, page: undefined }); }, 380);
  };

  const handleSearchSubmit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    navigate({ q: inputValue.trim(), page: undefined });
  };

  const activeTagList    = tags ? tags.split(",").filter(Boolean) : [];
  const activeFilterCount =
    (category ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + activeTagList.length;
  const currentSort = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  // -- Filter sidebar content -------------------------------------------------
  const SidebarContent = (
    <div className="space-y-0">
      {/* Categories */}
      <FilterAccordion title="Category">
        <FilterBtn active={!category} onClick={() => navigate({ category: "", page: undefined })}>
          All Categories
        </FilterBtn>
        {categories.slice(0, 14).map((cat) => (
          <FilterBtn
            key={cat.id}
            active={category === cat.slug}
            onClick={() => navigate({ category: cat.slug, page: undefined })}
          >
            <span>{cat.name}</span>
            {cat.productCount != null && (
              <span className="text-[11px] tabular-nums" style={{ color: "var(--charcoal-mist)" }}>
                {cat.productCount}
              </span>
            )}
          </FilterBtn>
        ))}
        {/* Elasticsearch facets */}
        {results?.facets?.categories && results.facets.categories.length > 0 && (
          <div className="mt-2 pt-2 border-t border-(--border-subtle)">
            <div className="text-[10px] uppercase tracking-wider mb-1.5 px-2.5" style={{ color: "var(--charcoal-mist)" }}>
              In results
            </div>
            {results.facets.categories.map((f) => (
              <FilterBtn
                key={f.key}
                active={category === f.key}
                onClick={() => navigate({ category: f.key, page: undefined })}
              >
                <span>{f.name}</span>
                <span
                  className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--off-white-2)", color: "var(--charcoal-mist)" }}
                >
                  {f.count}
                </span>
              </FilterBtn>
            ))}
          </div>
        )}
      </FilterAccordion>

      {/* Price */}
      <FilterAccordion title="Price" count={minPrice || maxPrice ? 1 : 0}>
        <div className="space-y-1 mb-3">
          {PRICE_PRESETS.map((p) => (
            <FilterBtn
              key={p.label}
              active={minPrice === String(p.min) && maxPrice === String(p.max)}
              onClick={() => navigate({ minPrice: String(p.min), maxPrice: String(p.max), page: undefined })}
            >
              {p.label}
            </FilterBtn>
          ))}
        </div>
        <div className="flex gap-2 items-center mb-2">
          <input
            type="number"
            placeholder="Min $"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="flex-1 border rounded-lg px-2.5 py-1.5 text-[12px] outline-none transition-colors focus:border-(--charcoal)"
            style={{ borderColor: "var(--border-light)", color: "var(--charcoal)", background: "var(--bg-surface)" }}
          />
          <span className="text-[12px]" style={{ color: "var(--charcoal-mist)" }}>–</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="flex-1 border rounded-lg px-2.5 py-1.5 text-[12px] outline-none transition-colors focus:border-(--charcoal)"
            style={{ borderColor: "var(--border-light)", color: "var(--charcoal)", background: "var(--bg-surface)" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate({ minPrice: minPriceInput, maxPrice: maxPriceInput, page: undefined })}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--charcoal)" }}
          >
            Apply
          </button>
          {(minPrice || maxPrice) && (
            <button
              onClick={() => { setMinPriceInput(""); setMaxPriceInput(""); navigate({ minPrice: "", maxPrice: "", page: undefined }); }}
              className="px-3 py-1.5 rounded-lg text-[11px] border transition-colors hover:border-(--charcoal)"
              style={{ borderColor: "var(--border-light)", color: "var(--charcoal-mist)" }}
            >
              Clear
            </button>
          )}
        </div>
      </FilterAccordion>

      {/* Tags */}
      {results?.facets?.tags && results.facets.tags.length > 0 && (
        <FilterAccordion title="Tags" count={activeTagList.length} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {results.facets.tags.map((t) => {
              const active = activeTagList.includes(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    const next = active
                      ? activeTagList.filter((x) => x !== t.key)
                      : [...activeTagList, t.key];
                    navigate({ tags: next.join(","), page: undefined });
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    background: active ? "var(--red-muted)" : "transparent",
                    borderColor: active ? "var(--red)" : "var(--border-light)",
                    color: active ? "var(--red)" : "var(--charcoal-soft)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t.key}
                  <span className="ml-1 opacity-50 text-[10px]">{t.count}</span>
                </button>
              );
            })}
          </div>
        </FilterAccordion>
      )}

      {/* Merchants */}
      {results?.facets?.merchants && results.facets.merchants.length > 0 && (
        <FilterAccordion title="Seller" defaultOpen={false}>
          {results.facets.merchants.map((m) => (
            <FilterBtn key={m.key} active={false} onClick={() => {}}>
              <span>{m.name}</span>
              <span className="text-[10px] tabular-nums" style={{ color: "var(--charcoal-mist)" }}>{m.count}</span>
            </FilterBtn>
          ))}
        </FilterAccordion>
      )}

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          onClick={() => navigate({ category: "", minPrice: "", maxPrice: "", tags: "", page: undefined })}
          className="w-full mt-1 py-2 rounded-xl text-[12px] font-semibold border transition-all hover:bg-(--red) hover:text-white hover:border-(--red) flex items-center justify-center gap-2"
          style={{ borderColor: "var(--border-mid)", color: "var(--charcoal)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* -- Search Header ------------------------------------------------------
       * NOT sticky — the main site Navbar is already sticky (z-50).
       * Two sibling sticky elements at top:0 would overlap.
       * The header sits in normal document flow below the Navbar.
       */}
      <div style={{ background: "var(--charcoal)", padding: "28px 0 20px" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="text-[11px] transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>
              Home
            </Link>
            <ChevronRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>Search</span>
            {q && (
              <>
                <ChevronRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  &ldquo;{q}&rdquo;
                </span>
              </>
            )}
          </nav>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                {isPending || loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--red)" }} />
                ) : (
                  <Search className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search products, categories, brands…"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl text-[15px] text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  fontFamily: "var(--font-body)",
                  caretColor: "var(--red)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--red)";
                  e.target.style.background = "rgba(255,255,255,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.background = "rgba(255,255,255,0.08)";
                }}
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => { setInputValue(""); navigate({ q: "", page: undefined }); inputRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 flex-wrap" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            {results && !loading && (
              <>
                <span>
                  <strong style={{ color: "#fff" }}>{results.total.toLocaleString("en-US")}</strong>{" "}
                  result{results.total !== 1 ? "s" : ""}
                </span>
                {results.queryTime !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {results.queryTime}ms
                  </span>
                )}
                {results.suggestion && (
                  <span className="flex items-center gap-1" style={{ color: "rgba(255,200,100,0.8)" }}>
                    <Sparkles className="w-3 h-3" />
                    Did you mean?{" "}
                    <button
                      onClick={() => navigate({ q: results.suggestion, page: undefined })}
                      className="font-bold underline"
                      style={{ color: "#ffc864" }}
                    >
                      {results.suggestion}
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* -- Active Filters Bar --------------------------------------------------- */}
      {activeFilterCount > 0 && (
        <div className="bg-white border-b border-(--border-subtle)">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--charcoal-mist)" }}>
              Filters:
            </span>
            {category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "var(--red-muted)", color: "var(--red)", border: "1px solid var(--red-subtle)" }}>
                <Tag className="w-2.5 h-2.5" />{category}
                <button onClick={() => navigate({ category: "", page: undefined })} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "var(--red-muted)", color: "var(--red)", border: "1px solid var(--red-subtle)" }}>
                ${minPrice || "0"} – ${maxPrice || "∞"}
                <button onClick={() => navigate({ minPrice: "", maxPrice: "", page: undefined })} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeTagList.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "var(--red-muted)", color: "var(--red)", border: "1px solid var(--red-subtle)" }}>
                #{tag}
                <button onClick={() => navigate({ tags: activeTagList.filter((t) => t !== tag).join(","), page: undefined })} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button
              onClick={() => navigate({ category: "", minPrice: "", maxPrice: "", tags: "", page: undefined })}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors hover:border-(--charcoal) hover:text-(--charcoal)"
              style={{ borderColor: "var(--border-light)", color: "var(--charcoal-mist)" }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* -- Main Layout ----------------------------------------------------------- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex gap-7 items-start">

        {/* Desktop sidebar */}
        <aside
          className="hidden lg:block shrink-0 sticky"
          style={{ width: 220, top: 76 }}
        >
          <div
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: "var(--charcoal)" }} />
                <span className="text-[12px] font-bold" style={{ color: "var(--charcoal)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Filters
                </span>
              </div>
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: "var(--red)" }}>
                  {activeFilterCount}
                </span>
              )}
            </div>
            {SidebarContent}
          </div>
        </aside>

        {/* Results column */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <button
                className="lg:hidden flex items-center gap-2 px-3 h-9 rounded-xl border text-[13px] font-semibold transition-all"
                onClick={() => setMobileFiltersOpen(true)}
                style={{
                  borderColor: activeFilterCount > 0 ? "var(--red)" : "var(--border-mid)",
                  background: activeFilterCount > 0 ? "var(--red-muted)" : "var(--bg-surface)",
                  color: activeFilterCount > 0 ? "var(--red)" : "var(--charcoal)",
                }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: "var(--red)" }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View toggle */}
              <div
                className="flex rounded-xl overflow-hidden"
                style={{ border: "1.5px solid var(--border-light)", background: "var(--bg-surface)" }}
              >
                {(["grid", "list"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setViewMode(m); localStorage.setItem("search-view-mode", m); }}
                    className="w-9 h-9 flex items-center justify-center transition-all"
                    style={{
                      background: viewMode === m ? "var(--charcoal)" : "transparent",
                      color: viewMode === m ? "#fff" : "var(--charcoal-soft)",
                    }}
                    aria-label={`${m} view`}
                  >
                    {m === "grid" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Result count */}
              {results && !loading && (
                <p className="text-[12px] hidden sm:block" style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-mono)" }}>
                  <strong style={{ color: "var(--charcoal)" }}>{results.total.toLocaleString("en-US")}</strong> products
                  {isPending && <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin" />}
                </p>
              )}

              {/* Sort dropdown */}
              <div ref={sortMenuRef} className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 h-9 px-3 rounded-xl border text-[13px] font-medium transition-all hover:border-(--charcoal)"
                  style={{ borderColor: "var(--border-light)", background: "var(--bg-surface)", color: "var(--charcoal)" }}
                >
                  {currentSort.icon}
                  <span className="hidden sm:inline">{currentSort.label}</span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ transform: showSortMenu ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
                {showSortMenu && (
                  <div
                    className="absolute right-0 top-[calc(100%+6px)] rounded-xl overflow-hidden z-30"
                    style={{
                      background: "#fff",
                      border: "1px solid var(--border-light)",
                      boxShadow: "var(--shadow-lg)",
                      minWidth: 200,
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { navigate({ sort: opt.value, page: undefined }); setShowSortMenu(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition-colors hover:bg-(--off-white-2)"
                        style={{
                          background: sort === opt.value ? "var(--red-muted)" : "transparent",
                          color: sort === opt.value ? "var(--red)" : "var(--charcoal)",
                          fontWeight: sort === opt.value ? 600 : 400,
                        }}
                      >
                        <span style={{ color: sort === opt.value ? "var(--red)" : "var(--charcoal-mist)" }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-5" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
              {offline ? <Wifi className="w-5 h-5 shrink-0" style={{ color: "var(--danger)" }} /> : <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "var(--danger)" }} />}
              <span className="text-[13px] flex-1" style={{ color: "var(--danger)" }}>
                {offline ? "No internet connection. Check your network and try again." : error}
              </span>
              <button
                onClick={fetchResults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all hover:bg-(--danger) hover:text-white hover:border-(--danger)"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
              {Array.from({ length: viewMode === "grid" ? 12 : 5 }).map((_, i) => (
                <CardSkeleton key={i} view={viewMode} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && results && results.items.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-5">🔍</div>
              <h2 className="font-bold text-xl mb-2" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                No results found
              </h2>
              <p className="text-[14px] mb-8 max-w-sm mx-auto" style={{ color: "var(--charcoal-soft)" }}>
                {q ? (
                  <>No products for &ldquo;<strong>{q}</strong>&rdquo;. Try different keywords or adjust filters.</>
                ) : (
                  "Try adjusting your filters to see more results."
                )}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => navigate({ category: "", minPrice: "", maxPrice: "", tags: "", q: "", page: undefined })}
                    className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--charcoal)" }}
                  >
                    Clear Filters
                  </button>
                )}
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors hover:border-(--charcoal)"
                  style={{ borderColor: "var(--border-mid)", color: "var(--charcoal)" }}
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {/* No query state */}
          {!loading && !results && !error && !q && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(30,30,30,0.12)" }} strokeWidth={1.5} />
              <h2 className="font-normal text-2xl mb-2" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                What are you looking for?
              </h2>
              <p className="text-[14px]" style={{ color: "var(--charcoal-soft)" }}>
                Type something in the search box above to discover products.
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && results && results.items.length > 0 && (
            <>
              <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                {results.items.map((p) =>
                  viewMode === "list" ? (
                    <SearchListCard key={p.id} product={p} />
                  ) : (
                    <SharedProductCard
                      key={p.id}
                      product={p}
                      context="marketplace"
                      onAddToCart={(prod) =>
                        addItem({
                          offerId:           prod.id,
                          productId:         prod.id,
                          productName:       prod.name,
                          productImage:      prod.images?.[0],
                          price:             prod.price,
                          merchantId:        prod.merchantId,
                          merchantStoreName: prod.merchantStoreName ?? "",
                          merchantSlug:      prod.merchantSlug ?? "",
                          stock:             prod.stock,
                        })
                      }
                    />
                  )
                )}
              </div>

              {/* Pagination */}
              {results.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  <button
                    onClick={() => navigate({ page: page - 1 })}
                    disabled={page <= 1}
                    className="h-10 px-4 rounded-xl text-[13px] font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-(--charcoal)"
                    style={{ borderColor: "var(--border-light)", background: "#fff", color: "var(--charcoal)" }}
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: Math.min(results.totalPages, 7) }, (_, i) => {
                    let pg = i + 1;
                    if (results.totalPages > 7) {
                      if (page <= 4)                       pg = i + 1;
                      else if (page >= results.totalPages - 3) pg = results.totalPages - 6 + i;
                      else                                  pg = page - 3 + i;
                    }
                    return (
                      <button
                        key={pg}
                        onClick={() => navigate({ page: pg })}
                        className="w-10 h-10 rounded-xl text-[13px] font-semibold transition-all"
                        style={{
                          background: page === pg ? "var(--red)" : "#fff",
                          color:      page === pg ? "#fff" : "var(--charcoal)",
                          border:     page === pg ? "none" : "1.5px solid var(--border-light)",
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => navigate({ page: page + 1 })}
                    disabled={page >= results.totalPages}
                    className="h-10 px-4 rounded-xl text-[13px] font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-(--charcoal)"
                    style={{ borderColor: "var(--border-light)", background: "#fff", color: "var(--charcoal)" }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* -- Mobile Filters Drawer ------------------------------------------------ */}
      {mobileFiltersOpen && (
        <>
          {/* Backdrop — NO backdrop-filter blur (was causing page-wide blur) */}
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
          />
          {/* Drawer */}
          <div
            className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
            style={{
              width: "min(320px, 90vw)",
              background: "#fff",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 bg-white z-10"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" style={{ color: "var(--charcoal)" }} />
                <span className="font-bold text-[14px]" style={{ color: "var(--charcoal)" }}>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: "var(--red)" }}>
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors hover:border-(--charcoal)"
                style={{ borderColor: "var(--border-light)", color: "var(--charcoal-soft)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter content */}
            <div className="p-5">{SidebarContent}</div>

            {/* Footer CTA */}
            <div
              className="sticky bottom-0 px-5 py-4 bg-white"
              style={{ borderTop: "1px solid var(--border-light)" }}
            >
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-12 rounded-2xl text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--charcoal)" }}
              >
                Show {results?.total ?? "–"} results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
