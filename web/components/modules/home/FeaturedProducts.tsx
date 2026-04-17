"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
    productName: "Kablosuz Bluetooth Kulaklık Pro",
    categoryName: "Elektronik",
    merchantName: "TechStore TR",
    merchantSlug: "techstore-tr",
    price: 899,
    originalPrice: 1299,
    rating: 4.8,
    reviewCount: 234,
    stock: 45,
    imageEmoji: "🎧",
    isBuyBox: true,
    eta: "Yarın",
  },
  {
    id: "2",
    productId: "p2",
    productName: "Organik Pamuk Atlet Seti",
    categoryName: "Moda",
    merchantName: "Doğal Giyim",
    merchantSlug: "dogal-giyim",
    price: 249,
    rating: 4.6,
    reviewCount: 89,
    stock: 120,
    imageEmoji: "👕",
    isBuyBox: true,
    eta: "2-3 gün",
  },
  {
    id: "3",
    productId: "p3",
    productName: "Seramik Kahve Fincanı Seti",
    categoryName: "Ev & Yaşam",
    merchantName: "Ev Dekor Plus",
    merchantSlug: "ev-dekor-plus",
    price: 349,
    originalPrice: 499,
    rating: 4.9,
    reviewCount: 412,
    stock: 28,
    imageEmoji: "☕",
    isBuyBox: true,
    eta: "Bugün",
  },
  {
    id: "4",
    productId: "p4",
    productName: "Profesyonel Yoga Matı 6mm",
    categoryName: "Spor",
    merchantName: "SportLife",
    merchantSlug: "sportlife",
    price: 599,
    rating: 4.7,
    reviewCount: 156,
    stock: 67,
    imageEmoji: "🧘",
    isBuyBox: true,
    eta: "2-3 gün",
  },
  {
    id: "5",
    productId: "p5",
    productName: "Mekanik Klavye RGB Aydınlatmalı",
    categoryName: "Elektronik",
    merchantName: "PC World",
    merchantSlug: "pc-world",
    price: 1299,
    originalPrice: 1799,
    rating: 4.5,
    reviewCount: 78,
    stock: 15,
    imageEmoji: "⌨️",
    isBuyBox: true,
    eta: "3-4 gün",
  },
  {
    id: "6",
    productId: "p6",
    productName: "Doğal Argan Yağlı Şampuan",
    categoryName: "Kozmetik",
    merchantName: "Doğa Beauty",
    merchantSlug: "doga-beauty",
    price: 129,
    rating: 4.6,
    reviewCount: 328,
    stock: 200,
    imageEmoji: "🧴",
    isBuyBox: true,
    eta: "Yarın",
  },
  {
    id: "7",
    productId: "p7",
    productName: "Çocuk Ahşap Bulmaca Seti",
    categoryName: "Oyun & Hobi",
    merchantName: "Oyun Dünyası",
    merchantSlug: "oyun-dunyasi",
    price: 189,
    originalPrice: 259,
    rating: 4.8,
    reviewCount: 94,
    stock: 53,
    imageEmoji: "🧩",
    isBuyBox: true,
    eta: "2-3 gün",
  },
  {
    id: "8",
    productId: "p8",
    productName: "Minimalist Deri Cüzdan",
    categoryName: "Moda",
    merchantName: "Deri Ustalığı",
    merchantSlug: "deri-ustaligi",
    price: 449,
    rating: 4.7,
    reviewCount: 167,
    stock: 38,
    imageEmoji: "👜",
    isBuyBox: true,
    eta: "Yarın",
  },
];

const TABS = [
  { value: "featured", label: "Öne Çıkanlar" },
  { value: "bestsellers", label: "En Çok Satanlar" },
  { value: "new", label: "Yeni Gelenler" },
  { value: "deals", label: "Fırsatlar" },
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
    <section className="py-16 lg:py-20 bg-white border-t border-[#0D0D0D]/6">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-[2px] bg-[#C84B2F]" />
              <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
                Seçilmiş Ürünler
              </span>
            </div>
            <h2 className="text-[#0D0D0D] text-[28px] lg:text-[36px] leading-tight font-serif">
              Bugün ne keşfedeceksin?
            </h2>
          </div>

          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-[#7A7060] hover:text-[#C84B2F] transition-colors pb-1 border-b border-transparent hover:border-[#C84B2F] shrink-0"
          >
            Tüm ürünler
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="featured" className="mb-8">
          <TabsList className="bg-transparent border-b border-[#0D0D0D]/8 w-full justify-start rounded-none h-auto p-0 gap-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="font-mono text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#C84B2F] data-[state=active]:text-[#C84B2F] data-[state=active]:shadow-none data-[state=active]:bg-transparent text-[#7A7060] hover:text-[#0D0D0D] transition-colors -mb-[1px] bg-transparent"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.has(product.id)}
              onWishlist={() => toggleWishlist(product.id)}
            />
          ))}
        </div>

        {/* Load more */}
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            asChild
            className="border-2 border-[#0D0D0D] text-[#0D0D0D] font-mono text-[11px] uppercase tracking-[2px] hover:bg-[#0D0D0D] hover:text-[#F5F2EB] transition-colors rounded-sm px-8 py-3.5 h-auto"
          >
            <Link href="/products">
              Daha Fazla Ürün Gör
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </Button>
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
    <div className="group relative bg-[#F5F2EB] border border-[#0D0D0D]/8 rounded-sm overflow-hidden hover:border-[#0D0D0D]/20 hover:shadow-[4px_4px_0_0_#0D0D0D08] transition-all duration-200">
      <Link href={`/product/${product.productId}`} className="block relative">
        <div className="aspect-square bg-gradient-to-br from-[#F5F2EB] to-[#E8E4D8] flex items-center justify-center text-5xl relative overflow-hidden">
          <span className="transition-transform duration-300 group-hover:scale-110 select-none">
            {product.imageEmoji}
          </span>

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge className="font-mono text-[9px] bg-[#C84B2F] text-white px-1.5 py-0.5 rounded-sm h-auto">
                -%{discount}
              </Badge>
            )}
            {product.stock < 20 && (
              <Badge className="font-mono text-[9px] bg-[#8B5E1A] text-white px-1.5 py-0.5 rounded-sm h-auto">
                Son {product.stock}
              </Badge>
            )}
          </div>

          {product.isBuyBox && (
            <div className="absolute bottom-2.5 right-2.5">
              <Badge className="font-mono text-[8px] bg-[#2D7A4F] text-white px-1.5 py-0.5 rounded-sm h-auto uppercase tracking-wider">
                ✓ Buy Box
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist button */}
      <button
        onClick={onWishlist}
        className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm border border-[#0D0D0D]/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-[#C84B2F]"
        aria-label="Favorilere ekle"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={isWishlisted ? "#C84B2F" : "none"}
          stroke={isWishlisted ? "#C84B2F" : "#0D0D0D"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#7A7060]">
            {product.categoryName}
          </span>
          <Link
            href={`/store/${product.merchantSlug}`}
            className="font-mono text-[9px] text-[#1A4A6B] hover:underline truncate max-w-[90px]"
            onClick={(e) => e.stopPropagation()}
          >
            {product.merchantName}
          </Link>
        </div>

        <Link href={`/product/${product.productId}`}>
          <h3 className="text-[#0D0D0D] text-[13px] font-semibold leading-snug mb-2 hover:text-[#C84B2F] transition-colors line-clamp-2">
            {product.productName}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill={star <= Math.round(product.rating) ? "#F59E0B" : "none"}
                stroke="#F59E0B"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="text-[10px] text-[#7A7060]">
            ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[#0D0D0D] text-[17px] font-bold leading-none font-serif">
              ₺{product.price.toLocaleString("tr-TR")}
            </div>
            {product.originalPrice && (
              <div className="text-[10px] text-[#7A7060] line-through mt-0.5">
                ₺{product.originalPrice.toLocaleString("tr-TR")}
              </div>
            )}
            <div className="font-mono text-[9px] text-[#2D7A4F] mt-1 uppercase tracking-wider">
              {product.eta} teslim
            </div>
          </div>

          <Button
            size="sm"
            className="w-8 h-8 p-0 bg-[#0D0D0D] text-[#F5F2EB] rounded-sm hover:bg-[#C84B2F] transition-colors"
            aria-label="Sepete ekle"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
