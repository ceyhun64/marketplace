"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[3px] text-blue-600 font-bold">
                Curated Selection
              </span>
            </div>
            <h2 className="text-black text-3xl lg:text-4xl font-bold tracking-tight">
              What will you discover today?
            </h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-bold text-black hover:opacity-70 transition-opacity group"
          >
            All Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="featured" className="mb-10">
          <TabsList className="bg-transparent w-full justify-start rounded-none h-auto p-0 gap-8 border-b border-gray-100">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-sm font-bold px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black text-gray-400 hover:text-black transition-all bg-transparent shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
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
          <Button
            variant="outline"
            asChild
            className="border-gray-200 text-black font-bold text-sm hover:bg-black hover:text-white hover:border-black transition-all rounded-xl px-10 py-6 h-auto"
          >
            <Link href="/products">Explore Full Catalog</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, isWishlisted, onWishlist }: any) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div className="group relative bg-white transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/5] bg-gray-50 rounded-[24px] overflow-hidden flex items-center justify-center text-6xl transition-all group-hover:shadow-xl group-hover:shadow-gray-100">
        <span className="transition-transform duration-500 group-hover:scale-110 select-none">
          {product.imageEmoji}
        </span>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {discount > 0 && (
            <Badge className="bg-red-500 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-lg">
              -{discount}%
            </Badge>
          )}
          {product.isBuyBox && (
            <Badge className="bg-black text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-lg uppercase">
              Best Offer
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onWishlist();
          }}
          className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-90"
        >
          <Heart
            className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`}
          />
        </button>

        {/* Quick Add Button */}
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-11 font-bold text-xs gap-2">
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-5 space-y-2">
        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-gray-400">
          <span>{product.categoryName}</span>
          <span className="text-blue-600">{product.merchantName}</span>
        </div>

        <Link href={`/product/${product.productId}`}>
          <h3 className="text-black font-bold text-[15px] leading-tight hover:text-blue-600 transition-colors line-clamp-2">
            {product.productName}
          </h3>
        </Link>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-lg font-black text-black tracking-tighter">
              ₺{product.price.toLocaleString("en-US")}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₺{product.originalPrice.toLocaleString("en-US")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[11px] font-bold text-black">
              {product.rating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
