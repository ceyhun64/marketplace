"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  ShoppingCart,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  List,
  Tag,
  Store,
  Filter,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
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
  updatedAt?: string;
  // Elasticsearch-specific
  score?: number;
  highlights?: {
    name?: string[];
    description?: string[];
    tags?: string[];
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  iconUrl?: string;
  subCategories?: Category[];
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

type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "popular";
type ViewMode = "grid" | "list";

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PRICE_PRESETS = [
  { label: "$0 – $100", min: 0, max: 100 },
  { label: "$100 – $500", min: 100, max: 500 },
  { label: "$500 – $1000", min: 500, max: 1000 },
  { label: "$1000 – $5000", min: 1000, max: 5000 },
  { label: "$5000+", min: 5000, max: 999999 },
];

// ─── Highlight Helper ─────────────────────────────────────────────────────────

function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights?: string[];
}) {
  if (!highlights?.length) return <span>{text}</span>;
  const highlighted = highlights[0];
  // Parse <em> tags from Elasticsearch highlight
  const parts = highlighted.split(/(<em>.*?<\/em>)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("<em>") && part.endsWith("</em>")) {
          return (
            <mark
              key={i}
              style={{
                background: "var(--red-muted)",
                color: "var(--red)",
                fontWeight: 600,
                borderRadius: 2,
                padding: "0 2px",
              }}
            >
              {part.slice(4, -5)}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function SearchProductCard({
  product,
  viewMode,
}: {
  product: Product;
  viewMode: ViewMode;
}) {
  const href = `/product/${product.id}`;
  const coverImage = product.images?.[0] ?? null;
  const isOutOfStock = product.stock === 0;
  const cart = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    cart.addItem({
      offerId: product.id,
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0],
      price: product.price,
      merchantId: product.merchantId,
      merchantStoreName: product.merchantStoreName,
      merchantSlug: product.merchantSlug,
      stock: product.stock,
    });
    toast.success("Added to cart", {
      description: product.name,
      duration: 2000,
    });
  };

  if (viewMode === "list") {
    return (
      <Link href={href} className="group block">
        <div
          style={{
            display: "flex",
            gap: 16,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            borderRadius: 10,
            padding: 16,
            transition: "all 0.2s",
          }}
          className="hover:border-(--red) hover:shadow-md"
        >
          {/* Image */}
          <div
            style={{
              width: 120,
              height: 120,
              flexShrink: 0,
              borderRadius: 8,
              overflow: "hidden",
              background: "var(--off-white-2)",
              position: "relative",
            }}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingCart
                  size={28}
                  style={{ color: "var(--charcoal-mist)" }}
                />
              </div>
            )}
            {isOutOfStock && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(250,250,250,0.75)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--charcoal-soft)",
                  letterSpacing: "0.05em",
                }}
              >
                OUT OF STOCK
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--red)",
                fontWeight: 600,
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Tag size={10} />
              {product.categoryName}
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--charcoal)",
                marginBottom: 6,
                lineHeight: 1.3,
              }}
            >
              <HighlightedText
                text={product.name}
                highlights={product.highlights?.name}
              />
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--charcoal-soft)",
                lineHeight: 1.5,
                marginBottom: 8,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              <HighlightedText
                text={product.description}
                highlights={product.highlights?.description}
              />
            </p>
            {product.tags?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {product.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      background: "var(--off-white-2)",
                      borderRadius: 20,
                      color: "var(--charcoal-soft)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--charcoal-mist)",
              }}
            >
              <Store size={11} />
              <span>{product.merchantStoreName}</span>
            </div>
          </div>

          {/* Price & CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "space-between",
              minWidth: 120,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--charcoal)",
                  letterSpacing: "-0.03em",
                }}
              >
                {formatPrice(product.price)}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              style={{
                background: "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: isOutOfStock ? 0.5 : 1,
              }}
              disabled={isOutOfStock}
            >
              <ShoppingCart size={14} />
              Add to Cart
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block">
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: 10,
          overflow: "hidden",
          transition: "all 0.25s",
          position: "relative",
        }}
        className="hover:-translate-y-1 hover:shadow-lg hover:border-(--red)"
      >
        {/* Red hover top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "var(--red)",
            transform: "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 0.3s",
            zIndex: 10,
          }}
          className="group-hover:scale-x-100"
        />

        {/* Image */}
        <div
          style={{
            aspectRatio: "1/1",
            background: "var(--off-white-2)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s",
                filter: isOutOfStock ? "grayscale(60%) opacity(0.7)" : "none",
              }}
              className="group-hover:scale-105"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={36} style={{ color: "rgba(30,30,30,0.1)" }} />
            </div>
          )}
          {isOutOfStock && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(250,250,250,0.7)",
                backdropFilter: "blur(2px)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "var(--charcoal-soft)",
                  border: "1.5px solid currentColor",
                  padding: "4px 10px",
                  borderRadius: 4,
                }}
              >
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "12px 14px 14px" }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--red)",
              fontWeight: 600,
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {product.categoryName}
          </div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--charcoal)",
              lineHeight: 1.35,
              marginBottom: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <HighlightedText
              text={product.name}
              highlights={product.highlights?.name}
            />
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "var(--charcoal)",
                letterSpacing: "-0.02em",
              }}
            >
              {formatPrice(product.price)}
            </span>
            <button
              onClick={(e) => {
                handleAddToCart(e);
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1.5px solid var(--border-mid)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                color: "var(--charcoal-soft)",
              }}
              className="hover:bg-(--red) hover:border-(--red) hover:text-white"
              disabled={isOutOfStock}
            >
              <ShoppingCart size={14} />
            </button>
          </div>

          {product.merchantStoreName && (
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: "var(--charcoal-mist)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Store size={10} />
              {product.merchantStoreName}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div
        style={{
          display: "flex",
          gap: 16,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            flexShrink: 0,
            borderRadius: 8,
            background: "var(--off-white-2)",
            animation: "pulse 1.5s infinite",
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 12,
              width: "30%",
              background: "var(--off-white-2)",
              borderRadius: 4,
              marginBottom: 8,
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            style={{
              height: 16,
              width: "70%",
              background: "var(--off-white-2)",
              borderRadius: 4,
              marginBottom: 8,
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            style={{
              height: 12,
              width: "90%",
              background: "var(--off-white-2)",
              borderRadius: 4,
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        overflow: "hidden",
        animation: "pulse 1.5s infinite",
      }}
    >
      <div style={{ aspectRatio: "1/1", background: "var(--off-white-2)" }} />
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            height: 10,
            width: "40%",
            background: "var(--off-white-2)",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 14,
            width: "85%",
            background: "var(--off-white-2)",
            borderRadius: 4,
            marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              height: 18,
              width: "35%",
              background: "var(--off-white-2)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              width: 34,
              height: 34,
              background: "var(--off-white-2)",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Filter ───────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        paddingBottom: 16,
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: "0 0 12px 0",
          color: "var(--charcoal)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
        <ChevronDown
          size={15}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "var(--charcoal-soft)",
          }}
        />
      </button>
      {open && children}
    </div>
  );
}

// ─── Main SearchPage Component ────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const tags = searchParams.get("tags") || "";
  const sort = (searchParams.get("sort") || "relevance") as SortOption;
  const page = parseInt(searchParams.get("page") || "1");

  // UI state
  const [inputValue, setInputValue] = useState(q);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Data state
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // ── URL builder ──────────────────────────────────────────────────────────────
  const buildUrl = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      const current = {
        q,
        category,
        minPrice,
        maxPrice,
        tags,
        sort,
        page: String(page),
        ...overrides,
      };
      Object.entries(current).forEach(([k, v]) => {
        if ((v && String(v) !== "" && String(v) !== "1") || k === "q") {
          if (v) params.set(k, String(v));
        }
      });
      // Always include q even if empty
      if (!params.has("q") && current.q) params.set("q", String(current.q));
      return `${pathname}?${params.toString()}`;
    },
    [q, category, minPrice, maxPrice, tags, sort, page, pathname],
  );

  const navigate = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      startTransition(() => {
        router.push(buildUrl(overrides));
      });
    },
    [buildUrl, router],
  );

  // ── Fetch search results ─────────────────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (tags) params.set("tags", tags);
      if (sort && sort !== "relevance") params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/products/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed. Please try again.");
      const data = await res.json();

      const rawItems: any[] =
        data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
      const products: Product[] = rawItems.map((p: any) => ({
        id: p.id ?? p.Id,
        merchantId: p.merchantId ?? "",
        merchantStoreName: p.merchantStoreName ?? p.merchant?.storeName ?? "",
        merchantSlug: p.merchantSlug ?? p.merchant?.slug ?? "",
        name: p.name ?? p.Name ?? "",
        description: p.description ?? p.Description ?? "",
        categoryId: p.categoryId ?? "",
        categoryName: p.categoryName ?? p.Category ?? p.category?.name ?? "",
        images: p.images ?? p.Images ?? [],
        tags: p.tags ?? [],
        price: p.price ?? p.Price ?? p.minPrice ?? 0,
        stock: p.stock ?? 0,
        publishToMarket: p.publishToMarket ?? true,
        publishToStore: p.publishToStore ?? true,
        isApproved: p.isApproved ?? true,
        isDeleted: p.isDeleted ?? false,
        createdAt: p.createdAt ?? "",
        updatedAt: p.updatedAt,
        score: p._score ?? p.score,
        highlights: p.highlight ?? p.highlights,
      }));

      setResults({
        items: products,
        total: data?.total ?? data?.Total ?? products.length,
        page: data?.page ?? page,
        totalPages:
          data?.totalPages ?? Math.ceil((data?.total ?? products.length) / 20),
        facets: data?.facets,
        queryTime: data?.took ?? data?.queryTime,
        suggestion: data?.suggestion,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching results");
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, tags, sort, page]);

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats: Category[] =
          data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  // Fetch on param change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Debounced search input
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: value, page: undefined });
    }, 350);
  };

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync input with URL q
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  const activeTagList = tags ? tags.split(",").filter(Boolean) : [];

  const activeFilterCount =
    (category ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + activeTagList.length;

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Most Relevant";

  // ── Sidebar content ──────────────────────────────────────────────────────────
  const Sidebar = (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
      }}
    >
      {/* Categories */}
      <FilterSection title="Categories">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li>
            <button
              onClick={() => navigate({ category: "", page: undefined })}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: !category ? "var(--red-muted)" : "transparent",
                color: !category ? "var(--red)" : "var(--charcoal-soft)",
                fontWeight: !category ? 600 : 400,
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                marginBottom: 2,
                transition: "all 0.15s",
              }}
            >
              All
            </button>
          </li>
          {categories.slice(0, 12).map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() =>
                  navigate({ category: cat.slug, page: undefined })
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background:
                    category === cat.slug ? "var(--red-muted)" : "transparent",
                  color:
                    category === cat.slug
                      ? "var(--red)"
                      : "var(--charcoal-soft)",
                  fontWeight: category === cat.slug ? 600 : 400,
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                  marginBottom: 2,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{cat.name}</span>
                {cat.subCategories?.length ? <ChevronRight size={12} /> : null}
              </button>
            </li>
          ))}
        </ul>

        {/* Facets from Elasticsearch */}
        {results?.facets?.categories &&
          results.facets.categories.length > 0 && (
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--charcoal-mist)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                In Results
              </div>
              {results.facets.categories.map((facet) => (
                <button
                  key={facet.key}
                  onClick={() =>
                    navigate({ category: facet.key, page: undefined })
                  }
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background:
                      category === facet.key
                        ? "var(--red-muted)"
                        : "transparent",
                    color:
                      category === facet.key
                        ? "var(--red)"
                        : "var(--charcoal-soft)",
                    fontWeight: category === facet.key ? 600 : 400,
                    padding: "5px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    marginBottom: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{facet.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      background: "var(--off-white-2)",
                      borderRadius: 10,
                      padding: "1px 6px",
                      color: "var(--charcoal-mist)",
                    }}
                  >
                    {facet.count}
                  </span>
                </button>
              ))}
            </div>
          )}
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div style={{ marginBottom: 10 }}>
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() =>
                navigate({
                  minPrice: String(preset.min),
                  maxPrice: String(preset.max),
                  page: undefined,
                })
              }
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background:
                  minPrice === String(preset.min) &&
                  maxPrice === String(preset.max)
                    ? "var(--red-muted)"
                    : "transparent",
                color:
                  minPrice === String(preset.min) &&
                  maxPrice === String(preset.max)
                    ? "var(--red)"
                    : "var(--charcoal-soft)",
                fontWeight:
                  minPrice === String(preset.min) &&
                  maxPrice === String(preset.max)
                    ? 600
                    : 400,
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                marginBottom: 2,
                transition: "all 0.15s",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <input
            type="number"
            placeholder="Min $"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            style={{
              flex: 1,
              border: "1.5px solid var(--border-light)",
              borderRadius: 7,
              padding: "6px 10px",
              fontSize: 12,
              color: "var(--charcoal)",
              background: "var(--bg-surface)",
              outline: "none",
            }}
          />
          <span style={{ color: "var(--charcoal-mist)", fontSize: 12 }}>—</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            style={{
              flex: 1,
              border: "1.5px solid var(--border-light)",
              borderRadius: 7,
              padding: "6px 10px",
              fontSize: 12,
              color: "var(--charcoal)",
              background: "var(--bg-surface)",
              outline: "none",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() =>
            navigate({
              minPrice: minPriceInput,
              maxPrice: maxPriceInput,
              page: undefined,
            })
          }
          style={{
            width: "100%",
            marginTop: 8,
            background: "var(--charcoal)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "7px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Apply
        </button>
        {(minPrice || maxPrice) && (
          <button
            onClick={() =>
              navigate({ minPrice: "", maxPrice: "", page: undefined })
            }
            style={{
              width: "100%",
              marginTop: 4,
              background: "transparent",
              color: "var(--charcoal-mist)",
              border: "1px solid var(--border-light)",
              borderRadius: 7,
              padding: "6px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Clear price filter
          </button>
        )}
      </FilterSection>

      {/* Tags / Facets */}
      {results?.facets?.tags && results.facets.tags.length > 0 && (
        <FilterSection title="Tags">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {results.facets.tags.map((facetTag) => {
              const isActive = activeTagList.includes(facetTag.key);
              return (
                <button
                  key={facetTag.key}
                  onClick={() => {
                    const newTags = isActive
                      ? activeTagList.filter((t) => t !== facetTag.key)
                      : [...activeTagList, facetTag.key];
                    navigate({ tags: newTags.join(","), page: undefined });
                  }}
                  style={{
                    border: isActive
                      ? "1.5px solid var(--red)"
                      : "1.5px solid var(--border-light)",
                    background: isActive ? "var(--red-muted)" : "transparent",
                    color: isActive ? "var(--red)" : "var(--charcoal-soft)",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: isActive ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {facetTag.key}
                  <span
                    style={{
                      marginLeft: 4,
                      opacity: 0.6,
                      fontSize: 10,
                    }}
                  >
                    {facetTag.count}
                  </span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}
    </aside>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        fontFamily: "var(--font-sans, system-ui)",
      }}
    >
      {/* ── Search Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--charcoal)",
          padding: "32px 0 24px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 16,
            }}
          >
            <Link
              href="/"
              style={{ color: "inherit", textDecoration: "none" }}
              className="hover:text-white"
            >
              Home
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: "rgba(255,255,255,0.7)" }}>Search</span>
            {q && (
              <>
                <ChevronRight size={12} />
                <span style={{ color: "rgba(255,255,255,0.9)" }}>
                  &ldquo;{q}&rdquo;
                </span>
              </>
            )}
          </div>

          {/* Search input */}
          <div style={{ position: "relative", maxWidth: 680 }}>
            <div
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color:
                  isPending || loading ? "var(--red)" : "rgba(255,255,255,0.4)",
                transition: "color 0.2s",
              }}
            >
              {isPending || loading ? (
                <Loader2
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Search size={18} />
              )}
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search products, categories or brands..."
              style={{
                width: "100%",
                padding: "14px 48px 14px 48px",
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                fontSize: 15,
                color: "#fff",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--red)";
                e.target.style.background = "rgba(255,255,255,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.12)";
                e.target.style.background = "rgba(255,255,255,0.08)";
              }}
            />
            {inputValue && (
              <button
                onClick={() => {
                  setInputValue("");
                  navigate({ q: "", page: undefined });
                }}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.4)",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Stats row */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {results && (
              <>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  <strong style={{ color: "#fff" }}>
                    {results.total.toLocaleString("en-US")}
                  </strong>{" "}
                  results
                </span>
                {results.queryTime !== undefined && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Clock size={11} />
                    {results.queryTime}ms
                  </span>
                )}
                {results.suggestion && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "rgba(255,200,100,0.8)",
                    }}
                  >
                    <Sparkles size={11} />
                    Did you mean?{" "}
                    <button
                      onClick={() =>
                        navigate({ q: results.suggestion, page: undefined })
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ffc864",
                        fontWeight: 600,
                        fontSize: 12,
                        textDecoration: "underline",
                      }}
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

      {/* ── Active Filters Bar ─────────────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--charcoal-mist)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Active Filters:
            </span>
            {category && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--red-muted)",
                  color: "var(--red)",
                  border: "1px solid var(--red-subtle)",
                  borderRadius: 20,
                  padding: "4px 12px 4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Tag size={11} />
                {category}
                <button
                  onClick={() => navigate({ category: "", page: undefined })}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--red)",
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--red-muted)",
                  color: "var(--red)",
                  border: "1px solid var(--red-subtle)",
                  borderRadius: 20,
                  padding: "4px 12px 4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ${minPrice || "0"} – ${maxPrice || "∞"}
                <button
                  onClick={() =>
                    navigate({ minPrice: "", maxPrice: "", page: undefined })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--red)",
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {activeTagList.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--red-muted)",
                  color: "var(--red)",
                  border: "1px solid var(--red-subtle)",
                  borderRadius: 20,
                  padding: "4px 12px 4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                #{tag}
                <button
                  onClick={() => {
                    const newTags = activeTagList.filter((t) => t !== tag);
                    navigate({ tags: newTags.join(","), page: undefined });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--red)",
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={() =>
                navigate({
                  category: "",
                  minPrice: "",
                  maxPrice: "",
                  tags: "",
                  page: undefined,
                })
              }
              style={{
                fontSize: 11,
                color: "var(--charcoal-mist)",
                background: "none",
                border: "1px solid var(--border-light)",
                borderRadius: 20,
                padding: "4px 10px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* ── Main Layout ───────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 24px 48px",
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
        }}
      >
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">{Sidebar}</div>

        {/* Results Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Mobile filter button */}
            <button
              className="lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1.5px solid var(--border-mid)",
                borderRadius: 8,
                padding: "8px 14px",
                background:
                  activeFilterCount > 0
                    ? "var(--red-muted)"
                    : "var(--bg-surface)",
                color: activeFilterCount > 0 ? "var(--red)" : "var(--charcoal)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: "var(--red)",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    marginLeft: 2,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div ref={sortDropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    border: "1.5px solid var(--border-light)",
                    borderRadius: 8,
                    padding: "7px 12px",
                    background: "var(--bg-surface)",
                    color: "var(--charcoal)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ArrowUpDown size={13} />
                  {currentSortLabel}
                  <ChevronDown
                    size={13}
                    style={{
                      transform: showSortDropdown ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s",
                    }}
                  />
                </button>
                {showSortDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-light)",
                      borderRadius: 10,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                      minWidth: 200,
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          navigate({ sort: opt.value, page: undefined });
                          setShowSortDropdown(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "9px 14px",
                          border: "none",
                          background:
                            sort === opt.value
                              ? "var(--red-muted)"
                              : "transparent",
                          color:
                            sort === opt.value
                              ? "var(--red)"
                              : "var(--charcoal)",
                          fontSize: 13,
                          fontWeight: sort === opt.value ? 600 : 400,
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (sort !== opt.value)
                            (e.target as HTMLElement).style.background =
                              "var(--off-white-2)";
                        }}
                        onMouseLeave={(e) => {
                          if (sort !== opt.value)
                            (e.target as HTMLElement).style.background =
                              "transparent";
                        }}
                      >
                        {opt.value === "relevance" && (
                          <Sparkles
                            size={12}
                            style={{ display: "inline", marginRight: 6 }}
                          />
                        )}
                        {opt.value === "newest" && (
                          <TrendingUp
                            size={12}
                            style={{ display: "inline", marginRight: 6 }}
                          />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div
                style={{
                  display: "flex",
                  border: "1.5px solid var(--border-light)",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "var(--bg-surface)",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    padding: "7px 10px",
                    border: "none",
                    background:
                      viewMode === "grid" ? "var(--charcoal)" : "transparent",
                    color:
                      viewMode === "grid" ? "#fff" : "var(--charcoal-soft)",
                    cursor: "pointer",
                    display: "flex",
                    transition: "all 0.15s",
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "7px 10px",
                    border: "none",
                    background:
                      viewMode === "list" ? "var(--charcoal)" : "transparent",
                    color:
                      viewMode === "list" ? "#fff" : "var(--charcoal-soft)",
                    cursor: "pointer",
                    display: "flex",
                    transition: "all 0.15s",
                  }}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#fff3f3",
                border: "1px solid rgba(200,16,46,0.2)",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 16,
                fontSize: 13,
                color: "var(--red)",
              }}
            >
              <AlertCircle size={16} />
              {error}
              <button
                onClick={fetchResults}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "1px solid var(--red)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--red)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div
              style={{
                display: viewMode === "grid" ? "grid" : "flex",
                flexDirection: viewMode === "list" ? "column" : undefined,
                gridTemplateColumns:
                  viewMode === "grid"
                    ? "repeat(auto-fill, minmax(180px, 1fr))"
                    : undefined,
                gap: 12,
              }}
            >
              {Array.from({ length: viewMode === "grid" ? 12 : 5 }).map(
                (_, i) => (
                  <ProductSkeleton key={i} viewMode={viewMode} />
                ),
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && results && results.items.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 24px",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--charcoal)",
                  marginBottom: 8,
                }}
              >
                No results found
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--charcoal-soft)",
                  marginBottom: 24,
                  maxWidth: 380,
                  margin: "0 auto 24px",
                }}
              >
                No products found for &ldquo;<strong>{q}</strong>&rdquo;. Try
                different keywords or adjust your filters.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() =>
                    navigate({
                      q: "",
                      category: "",
                      minPrice: "",
                      maxPrice: "",
                      tags: "",
                      page: undefined,
                    })
                  }
                  style={{
                    background: "var(--charcoal)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
                <Link
                  href="/"
                  style={{
                    background: "transparent",
                    color: "var(--charcoal)",
                    border: "1.5px solid var(--border-mid)",
                    borderRadius: 8,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {/* Results grid/list */}
          {!loading && results && results.items.length > 0 && (
            <>
              <div
                style={{
                  display: viewMode === "grid" ? "grid" : "flex",
                  flexDirection: viewMode === "list" ? "column" : undefined,
                  gridTemplateColumns:
                    viewMode === "grid"
                      ? "repeat(auto-fill, minmax(180px, 1fr))"
                      : undefined,
                  gap: 12,
                }}
              >
                {results.items.map((product) => (
                  <SearchProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Pagination */}
              {results.totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 32,
                  }}
                >
                  <button
                    onClick={() => navigate({ page: page - 1 })}
                    disabled={page <= 1}
                    style={{
                      padding: "8px 16px",
                      border: "1.5px solid var(--border-light)",
                      borderRadius: 8,
                      background: "var(--bg-surface)",
                      color:
                        page <= 1 ? "var(--charcoal-mist)" : "var(--charcoal)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: page <= 1 ? "default" : "pointer",
                      opacity: page <= 1 ? 0.5 : 1,
                    }}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: Math.min(results.totalPages, 7) }).map(
                    (_, i) => {
                      let pageNum = i + 1;
                      if (results.totalPages > 7) {
                        if (page <= 4) pageNum = i + 1;
                        else if (page >= results.totalPages - 3)
                          pageNum = results.totalPages - 6 + i;
                        else pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => navigate({ page: pageNum })}
                          style={{
                            width: 36,
                            height: 36,
                            border:
                              page === pageNum
                                ? "none"
                                : "1.5px solid var(--border-light)",
                            borderRadius: 8,
                            background:
                              page === pageNum
                                ? "var(--red)"
                                : "var(--bg-surface)",
                            color:
                              page === pageNum ? "#fff" : "var(--charcoal)",
                            fontSize: 13,
                            fontWeight: page === pageNum ? 700 : 400,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() => navigate({ page: page + 1 })}
                    disabled={page >= results.totalPages}
                    style={{
                      padding: "8px 16px",
                      border: "1.5px solid var(--border-light)",
                      borderRadius: 8,
                      background: "var(--bg-surface)",
                      color:
                        page >= results.totalPages
                          ? "var(--charcoal-mist)"
                          : "var(--charcoal)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor:
                        page >= results.totalPages ? "default" : "pointer",
                      opacity: page >= results.totalPages ? 0.5 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Filters Drawer ─────────────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <>
          <div
            onClick={() => setMobileFiltersOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 60,
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: 300,
              background: "var(--bg-surface)",
              zIndex: 70,
              overflowY: "auto",
              padding: 24,
              boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--charcoal)",
                  margin: 0,
                }}
              >
                Filters
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-light)",
                  borderRadius: 8,
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                  color: "var(--charcoal-soft)",
                }}
              >
                <X size={16} />
              </button>
            </div>
            {Sidebar}
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
