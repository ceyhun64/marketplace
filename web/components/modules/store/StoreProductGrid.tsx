"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Star, ChevronDown, LayoutGrid, X } from "lucide-react";
import { WishlistButton } from "@/components/modules/store/WishlistButton";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";

interface StoreOffer {
  id: string;
  productId: string;
  productName: string;
  productImages: string[];
  price: number;
  stock: number;
  rating: number;
  categoryName?: string;
  merchantId?: string;
  merchantStoreName?: string;
  merchantSlug?: string;
}

interface StoreProductGridProps {
  storeSlug: string;
  offers: StoreOffer[];
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: "default",    label: "Default" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating",     label: "Highest Rated" },
];

export function StoreProductGrid({ storeSlug, offers, isLoading }: StoreProductGridProps) {
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("default");
  const [category, setCategory]   = useState("all");
  const { addItem } = useCart();

  const safeOffers = Array.isArray(offers) ? offers : [];

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(safeOffers.map((o) => o.categoryName).filter(Boolean))
    ) as string[];
    return cats.sort();
  }, [safeOffers]);

  const filtered = useMemo(
    () =>
      safeOffers
        .filter((o) =>
          (category === "all" || o.categoryName === category) &&
          o.productName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
          if (sort === "price_asc")  return a.price - b.price;
          if (sort === "price_desc") return b.price - a.price;
          if (sort === "rating")     return b.rating - a.rating;
          return 0;
        }),
    [safeOffers, search, sort, category]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-5 p-3 rounded-2xl"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(30,30,30,0.09)",
          boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
        }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: "#b0b0b0" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full transition-colors"
              style={{ background: "rgba(30,30,30,0.08)", color: "#747474" }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <input
            placeholder="Search products in this store…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 h-10 text-sm rounded-xl outline-none transition-all"
            style={{
              background: "#f7f7f7",
              border: "1.5px solid rgba(30,30,30,0.1)",
              color: "#1e1e1e",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#c8102e";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,16,46,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(30,30,30,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: "#b0b0b0" }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 pl-3 pr-9 text-sm rounded-xl appearance-none cursor-pointer outline-none w-full sm:w-48"
            style={{
              background: "#f7f7f7",
              border: "1.5px solid rgba(30,30,30,0.1)",
              color: "#1e1e1e",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategory("all")}
            className="flex items-center gap-1.5 shrink-0 px-3 h-8 rounded-lg text-xs font-semibold transition-all"
            style={
              category === "all"
                ? { background: "#c8102e", color: "#fff", border: "1.5px solid #c8102e" }
                : { background: "#fff", color: "#525252", border: "1.5px solid rgba(30,30,30,0.1)" }
            }
          >
            <LayoutGrid className="h-3 w-3" />
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="shrink-0 px-3 h-8 rounded-lg text-xs font-semibold transition-all"
              style={
                category === cat
                  ? { background: "#c8102e", color: "#fff", border: "1.5px solid #c8102e" }
                  : { background: "#fff", color: "#525252", border: "1.5px solid rgba(30,30,30,0.1)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Result count ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "#9a9a9a" }}>
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {search && (
            <> for <span className="font-semibold" style={{ color: "#1e1e1e" }}>&ldquo;{search}&rdquo;</span></>
          )}
          {category !== "all" && (
            <> in <span className="font-semibold" style={{ color: "#1e1e1e" }}>{category}</span></>
          )}
        </p>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: "#ffffff", border: "1px solid rgba(30,30,30,0.09)" }}
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(30,30,30,0.05)" }}
          >
            <Search className="h-6 w-6" style={{ color: "#c0c0c0" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#1e1e1e" }}>
            No products found
          </p>
          <p className="text-xs" style={{ color: "#9a9a9a" }}>
            {search ? "Try a different search term" : "This store has no products yet"}
          </p>
          {(search || category !== "all") && (
            <button
              onClick={() => { setSearch(""); setCategory("all"); }}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: "rgba(200,16,46,0.08)", color: "#c8102e" }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        /* ── Product grid ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((offer) => (
            <ProductCard
              key={offer.id}
              offer={offer}
              onAddToCart={() =>
                addItem({
                  offerId: offer.id,
                  productId: offer.productId,
                  productName: offer.productName,
                  productImage: offer.productImages[0] ?? "",
                  merchantId: offer.merchantId ?? "",
                  merchantStoreName: offer.merchantStoreName ?? "",
                  merchantSlug: offer.merchantSlug ?? storeSlug,
                  price: offer.price,
                  stock: offer.stock,
                  source: "ESTORE",
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  offer,
  onAddToCart,
}: {
  offer: StoreOffer;
  onAddToCart: () => void;
}) {
  const productHref = `/product/${offer.productId}`;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-shadow duration-200 hover:shadow-md"
      style={{
        border: "1px solid rgba(30,30,30,0.09)",
        boxShadow: "0 1px 3px rgba(30,30,30,0.06)",
      }}
    >
      {/* Image */}
      <Link href={productHref} className="relative block overflow-hidden bg-gray-50" style={{ aspectRatio: "1/1" }}>
        {offer.productImages[0] ? (
          <Image
            src={offer.productImages[0]}
            alt={offer.productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl select-none">
            📦
          </div>
        )}

        {/* Out of stock */}
        {offer.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-md tracking-widest uppercase"
              style={{ background: "#c8102e", color: "#fff" }}
            >
              Out of Stock
            </span>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {offer.categoryName && offer.stock > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                backdropFilter: "blur(4px)",
              }}
            >
              {offer.categoryName}
            </span>
          )}
          {offer.rating === 0 && offer.stock > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{ background: "#c8102e", color: "#fff" }}
            >
              New
            </span>
          )}
        </div>

        {/* Wishlist — top-right, visible on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <WishlistButton
            productId={offer.productId}
            productName={offer.productName}
            productImage={offer.productImages[0]}
            price={offer.price}
            variant="icon"
          />
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3">
        <Link href={productHref}>
          <h3
            className="text-sm font-semibold line-clamp-2 leading-snug mb-2 hover:underline"
            style={{ color: "#1e1e1e" }}
          >
            {offer.productName}
          </h3>
        </Link>

        {offer.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium" style={{ color: "#525252" }}>
              {offer.rating.toFixed(1)}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2" style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}>
          <span className="font-bold text-sm" style={{ color: "#1e1e1e" }}>
            {formatPrice(offer.price)}
          </span>

          <button
            disabled={offer.stock === 0}
            onClick={onAddToCart}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              background: offer.stock > 0 ? "#c8102e" : "rgba(30,30,30,0.06)",
              color: offer.stock > 0 ? "#fff" : "#9a9a9a",
            }}
            onMouseEnter={(e) => {
              if (offer.stock > 0) (e.currentTarget as HTMLButtonElement).style.background = "#a00d24";
            }}
            onMouseLeave={(e) => {
              if (offer.stock > 0) (e.currentTarget as HTMLButtonElement).style.background = "#c8102e";
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
