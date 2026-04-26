"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Heart } from "lucide-react";

interface ProductOffer {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  merchantName: string;
  merchantSlug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  imageEmoji: string;
  isBuyBox: boolean;
  eta: string;
}

const MOCK_PRODUCTS: ProductOffer[] = [
  {
    id: "1",
    productId: "p1",
    productName: "Wireless Bluetooth Headphones Pro",
    categoryName: "Electronics",
    merchantName: "TechStore TR",
    merchantSlug: "techstore-tr",
    price: 899,
    originalPrice: 1299,
    rating: 4.8,
    reviewCount: 234,
    stock: 45,
    imageEmoji: "🎧",
    isBuyBox: true,
    eta: "Tomorrow",
  },
  {
    id: "2",
    productId: "p2",
    productName: "Organic Cotton Athletic Set",
    categoryName: "Fashion",
    merchantName: "Natural Wear",
    merchantSlug: "natural-wear",
    price: 249,
    rating: 4.6,
    reviewCount: 89,
    stock: 120,
    imageEmoji: "👕",
    isBuyBox: true,
    eta: "2-3 days",
  },
  {
    id: "3",
    productId: "p3",
    productName: "Ceramic Coffee Cup Set",
    categoryName: "Home & Living",
    merchantName: "Home Decor Plus",
    merchantSlug: "home-decor-plus",
    price: 349,
    originalPrice: 499,
    rating: 4.9,
    reviewCount: 412,
    stock: 28,
    imageEmoji: "☕",
    isBuyBox: true,
    eta: "Today",
  },
  {
    id: "4",
    productId: "p4",
    productName: "Professional Yoga Mat 6mm",
    categoryName: "Sports",
    merchantName: "SportLife",
    merchantSlug: "sportlife",
    price: 599,
    rating: 4.7,
    reviewCount: 156,
    stock: 67,
    imageEmoji: "🧘",
    isBuyBox: true,
    eta: "2-3 days",
  },
  {
    id: "5",
    productId: "p5",
    productName: "Mechanical Keyboard RGB Backlit",
    categoryName: "Electronics",
    merchantName: "PC World",
    merchantSlug: "pc-world",
    price: 1299,
    originalPrice: 1799,
    rating: 4.5,
    reviewCount: 78,
    stock: 15,
    imageEmoji: "⌨️",
    isBuyBox: true,
    eta: "3-4 days",
  },
  {
    id: "6",
    productId: "p6",
    productName: "Natural Argan Oil Shampoo",
    categoryName: "Cosmetics",
    merchantName: "Nature Beauty",
    merchantSlug: "nature-beauty",
    price: 129,
    rating: 4.6,
    reviewCount: 328,
    stock: 200,
    imageEmoji: "🧴",
    isBuyBox: true,
    eta: "Tomorrow",
  },
  {
    id: "7",
    productId: "p7",
    productName: "Kids Wooden Puzzle Set",
    categoryName: "Gaming & Hobbies",
    merchantName: "Toy World",
    merchantSlug: "toy-world",
    price: 189,
    originalPrice: 259,
    rating: 4.8,
    reviewCount: 94,
    stock: 53,
    imageEmoji: "🧩",
    isBuyBox: true,
    eta: "2-3 days",
  },
  {
    id: "8",
    productId: "p8",
    productName: "Minimalist Leather Wallet",
    categoryName: "Fashion",
    merchantName: "Leather Craft",
    merchantSlug: "leather-craft",
    price: 449,
    rating: 4.7,
    reviewCount: 167,
    stock: 38,
    imageEmoji: "👜",
    isBuyBox: true,
    eta: "Tomorrow",
  },
];

const TABS = [
  { value: "featured", label: "Featured" },
  { value: "bestsellers", label: "Best Sellers" },
  { value: "new", label: "New Arrivals" },
  { value: "deals", label: "Deals" },
];

export default function FeaturedProducts() {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("featured");

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--charcoal-soft)]">
                Curated Selection
              </span>
            </div>
            <h2
              className="text-[2.2rem] lg:text-[2.75rem] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--charcoal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What will you <em style={{ color: "var(--red)" }}>discover</em>{" "}
              today?
            </h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors group"
            style={{ fontFamily: "var(--font-body)" }}
          >
            All Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-8 mb-10 border-b"
          style={{ borderColor: "rgba(51,51,51,0.08)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="relative pb-4 text-sm font-semibold transition-colors duration-200"
              style={{
                fontFamily: "var(--font-body)",
                color: activeTab === tab.value ? "var(--charcoal)" : "var(--charcoal-soft)",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--red)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.has(product.id)}
              onWishlist={() => toggleWishlist(product.id)}
            />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 border font-semibold text-sm transition-all duration-250 rounded-lg"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "rgba(51,51,51,0.15)",
              color: "var(--charcoal)",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--red)";
              el.style.borderColor = "var(--red)";
              el.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.borderColor = "rgba(51,51,51,0.15)";
              el.style.color = "var(--charcoal)";
            }}
          >
            Explore Full Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  isWishlisted,
  onWishlist,
}: {
  product: ProductOffer;
  isWishlisted: boolean;
  onWishlist: () => void;
}) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: "0 1px 3px rgba(51,51,51,0.06)",
        border: "1px solid rgba(51,51,51,0.06)",
      }}
    >
      {/* Red accent top */}
      <div
        className="h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: "var(--red)" }}
      />

      {/* Image Container */}
      <div
        className="relative aspect-[4/5] overflow-hidden flex items-center justify-center text-6xl"
        style={{ background: "var(--off-white)" }}
      >
        <span className="transition-transform duration-500 group-hover:scale-110 select-none">
          {product.imageEmoji}
        </span>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium text-white"
              style={{ background: "var(--red)", letterSpacing: "0.05em" }}
            >
              -{discount}%
            </span>
          )}
          {product.isBuyBox && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium text-white"
              style={{ background: "var(--charcoal)", letterSpacing: "0.05em" }}
            >
              BEST OFFER
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onWishlist();
          }}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          style={{ boxShadow: "0 2px 8px rgba(51,51,51,0.12)" }}
        >
          <Heart
            className="w-4 h-4"
            style={{
              color: isWishlisted ? "var(--red)" : "var(--charcoal-soft)",
              fill: isWishlisted ? "var(--red)" : "none",
            }}
          />
        </button>

        {/* Quick Add */}
        <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{
              background: "var(--charcoal)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.03em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--charcoal)")}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--charcoal-soft)]">
            {product.categoryName}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.08em]"
            style={{ color: "var(--red)" }}
          >
            {product.merchantName}
          </span>
        </div>

        <Link href={`/product/${product.productId}`}>
          <h3
            className="font-bold text-[14px] leading-snug line-clamp-2 text-[var(--charcoal)] hover:text-[var(--red)] transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {product.productName}
          </h3>
        </Link>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span
              className="text-lg font-bold text-[var(--charcoal)] tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ₺{product.price.toLocaleString("en-US")}
            </span>
            {product.originalPrice && (
              <span className="block text-xs text-[var(--charcoal-soft)] line-through font-mono">
                ₺{product.originalPrice.toLocaleString("en-US")}
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: "var(--off-white)" }}
          >
            <Star className="w-3 h-3 fill-[var(--red)] text-[var(--red)]" />
            <span className="font-mono text-[11px] font-medium text-[var(--charcoal)]">
              {product.rating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
