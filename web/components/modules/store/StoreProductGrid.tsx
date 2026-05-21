"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Star, SlidersHorizontal } from "lucide-react";
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
  { value: "default", label: "Default" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Highest Rated" },
];

export function StoreProductGrid({
  storeSlug,
  offers,
  isLoading,
}: StoreProductGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const { addItem } = useCart();

  const filtered = (Array.isArray(offers) ? offers : [])
    .filter((o) => o.productName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-xl"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(30,30,30,0.1)",
          boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
        }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "#9a9a9a" }}
          />
          <input
            placeholder="Search in store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-shadow"
            style={{
              background: "#fafafa",
              border: "1px solid rgba(30,30,30,0.12)",
              color: "#1e1e1e",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(200,16,46,0.18)";
              e.currentTarget.style.borderColor = "#c8102e";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "rgba(30,30,30,0.12)";
            }}
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <SlidersHorizontal
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: "#9a9a9a" }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm rounded-lg appearance-none cursor-pointer outline-none"
            style={{
              background: "#fafafa",
              border: "1px solid rgba(30,30,30,0.12)",
              color: "#1e1e1e",
            }}
            className="w-full sm:w-48"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs mb-4" style={{ color: "#9a9a9a" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;
          {search}&quot;
        </p>
      )}

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(30,30,30,0.1)",
          }}
        >
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(30,30,30,0.04)" }}
          >
            <Search className="h-5 w-5" style={{ color: "#9a9a9a" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "#1e1e1e" }}>
            No products found
          </p>
          <p className="text-xs mt-1" style={{ color: "#9a9a9a" }}>
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((offer) => (
            <div
              key={offer.id}
              className="group overflow-hidden transition-all duration-200"
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid rgba(30,30,30,0.1)",
                boxShadow:
                  "0 1px 4px rgba(30,30,30,0.06), 0 1px 2px rgba(30,30,30,0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 4px 16px rgba(30,30,30,0.08), 0 2px 6px rgba(30,30,30,0.04)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 1px 4px rgba(30,30,30,0.06), 0 1px 2px rgba(30,30,30,0.04)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(0)";
              }}
            >
              {/* Image */}
              <Link href={`/store/${storeSlug}/product/${offer.productId}`}>
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: "1/1", background: "#f4f4f4" }}
                >
                  {offer.productImages[0] ? (
                    <Image
                      src={offer.productImages[0]}
                      alt={offer.productName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl">
                      📦
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {offer.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-md"
                        style={{
                          background: "#c8102e",
                          color: "#ffffff",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Category pill */}
                  {offer.categoryName && offer.stock > 0 && (
                    <div className="absolute top-2 left-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{
                          fontFamily: "monospace",
                          background: "rgba(30,30,30,0.7)",
                          color: "#ffffff",
                          backdropFilter: "blur(4px)",
                          letterSpacing: "0.06em",
                          fontSize: "10px",
                          textTransform: "uppercase",
                        }}
                      >
                        {offer.categoryName}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Body */}
              <div className="p-3">
                <Link href={`/store/${storeSlug}/product/${offer.productId}`}>
                  <h3
                    className="text-sm font-semibold line-clamp-2 mb-1 leading-snug hover:underline"
                    style={{ color: "#1e1e1e" }}
                  >
                    {offer.productName}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "#525252" }}
                  >
                    {offer.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between gap-2 px-3 py-2.5"
                style={{
                  borderTop: "1px solid rgba(30,30,30,0.06)",
                  background: "#fafafa",
                }}
              >
                <span
                  className="font-bold text-sm num"
                  style={{ color: "#1e1e1e" }}
                >
                  {formatPrice(offer.price)}
                </span>

                <button
                  disabled={offer.stock === 0}
                  onClick={() =>
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
                  className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-h-11 sm:min-h-0"
                  style={{
                    background:
                      offer.stock > 0 ? "#c8102e" : "rgba(30,30,30,0.08)",
                    color: offer.stock > 0 ? "#ffffff" : "#9a9a9a",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (offer.stock > 0) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#a00d24";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (offer.stock > 0) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#c8102e";
                    }
                  }}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
