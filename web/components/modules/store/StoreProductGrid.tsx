"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, LayoutGrid, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function offerToProduct(offer: StoreOffer): Product {
  return {
    id:               offer.productId,
    name:             offer.productName,
    images:           offer.productImages,
    price:            offer.price,
    stock:            offer.stock,
    categoryName:     offer.categoryName,
    merchantId:       offer.merchantId ?? "",
    merchantStoreName: offer.merchantStoreName,
    merchantSlug:     offer.merchantSlug,
    description:      "",
    categoryId:       "",
    tags:             [],
    publishToMarket:  false,
    publishToStore:   true,
    isApproved:       true,
    isDeleted:        false,
    createdAt:        "",
  };
}

export function StoreProductGrid({ storeSlug, offers, isLoading }: StoreProductGridProps) {
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState("default");
  const [category, setCategory] = useState("all");
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
        <div className="shrink-0">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-full sm:w-48 text-sm rounded-xl">
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
          {filtered.map((offer) => {
            const product = offerToProduct(offer);
            return (
              <ProductCard
                key={offer.id}
                product={product}
                context="store"
                storeSlug={storeSlug}
                onAddToCart={() =>
                  addItem({
                    offerId:           offer.id,
                    productId:         offer.productId,
                    productName:       offer.productName,
                    productImage:      offer.productImages[0] ?? "",
                    merchantId:        offer.merchantId ?? "",
                    merchantStoreName: offer.merchantStoreName ?? "",
                    merchantSlug:      offer.merchantSlug ?? storeSlug,
                    price:             offer.price,
                    stock:             offer.stock,
                    source:            "ESTORE",
                  })
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
