"use client";

import React from "react";
import Image from "next/image";
import { Star, CheckCircle, X, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface StockEntry {
  id: number;
  sizeId: number | null;
  stock: number;
  priceModifier: number;
}

interface ProductInfoProps {
  id: string;
  title: string;
  category: { id: number; name: string };
  middleCategory: { id: number; name: string } | null;
  subCategory: { id: number; name: string } | null;
  brand: { id: number; name: string; image: string | null } | null;
  rating: number;
  reviewCount: number;
  currentPrice: number;
  oldPrice: number | null;
  hasDiscount: boolean;
  discountPercentage: number;
  inStock: boolean;
  lowStock: boolean;
  stockQuantity: number;
  hasCustomImage: boolean;
  selectedStock: StockEntry | null; // stockMatrix'ten seçilen satır
}

export default function ProductInfo({
  id,
  title,
  category,
  middleCategory,
  subCategory,
  brand,
  rating,
  reviewCount,
  currentPrice,
  oldPrice,
  hasDiscount,
  discountPercentage,
  inStock,
  lowStock,
  stockQuantity,
  hasCustomImage,
  selectedStock,
}: ProductInfoProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="hidden lg:block">
        <nav className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <Link
            href="/products"
            className="hover:text-orange-600 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Koleksiyon
          </Link>

          {category && (
            <>
              <ChevronRight size={10} />
              <Link
                href={`/products/category/${category.id}`}
                className="hover:text-orange-600 transition-colors"
              >
                {category.name}
              </Link>

              {middleCategory && (
                <>
                  <ChevronRight size={10} />
                  <Link
                    href={`/products/category/${category.id}/${middleCategory.id}`}
                    className="hover:text-orange-600 transition-colors"
                  >
                    {middleCategory.name}
                  </Link>
                </>
              )}

              {subCategory && (
                <>
                  <ChevronRight size={10} />
                  <Link
                    href={`/products/category/${category.id}/${middleCategory?.id}/${subCategory.id}`}
                    className="hover:text-orange-600 transition-colors"
                  >
                    {subCategory.name}
                  </Link>
                </>
              )}
            </>
          )}

          <ChevronRight size={10} />
          <span className="text-slate-300">Ürün Detayı</span>
        </nav>
      </div>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-bold tracking-widest uppercase text-orange-600 flex items-center gap-2">
            <span className="bg-orange-50 px-2 py-0.5 rounded text-orange-700">
              {category.name}
            </span>
            <span className="text-slate-300">ID: PRO-{id}</span>
          </div>
          {brand && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {brand.image && (
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              )}
              <span className="font-semibold">{brand.name}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {title}
          {hasCustomImage && (
            <span className="ml-2 text-sm font-normal text-orange-600">
              (Özelleştirilmiş)
            </span>
          )}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex text-orange-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.round(rating) ? "currentColor" : "none"}
                  className={i < Math.round(rating) ? "" : "text-slate-300"}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-900">
              {rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            ({reviewCount} değerlendirme)
          </span>
        </div>

        {/* Stok Durumu */}
        <div className="flex items-center gap-2">
          {inStock ? (
            <>
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">
                Stokta Var
              </span>
              {lowStock && (
                <span className="text-xs text-orange-600 ml-2">
                  (Son {stockQuantity} adet!)
                </span>
              )}
            </>
          ) : (
            <>
              <X size={16} className="text-red-600" />
              <span className="text-sm font-semibold text-red-600">
                Stokta Yok
              </span>
            </>
          )}
        </div>
      </header>

      {/* Fiyat */}
      <div className="flex flex-col border-t border-b border-slate-100 py-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black tracking-tighter text-slate-900">
            {currentPrice.toLocaleString("tr-TR")}{" "}
            <small className="text-sm">TL</small>
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-slate-400 line-through font-semibold">
                {oldPrice?.toLocaleString("tr-TR")} TL
              </span>
              <span className="bg-orange-600 text-white px-2 py-1 text-xs font-bold">
                %{discountPercentage} İndirim
              </span>
            </>
          )}
        </div>
        {/* Seçilen beden fiyat farkı */}
        {selectedStock && selectedStock.priceModifier !== 0 && (
          <span className="text-xs text-slate-500 mt-2">
            Seçilen beden: {selectedStock.priceModifier > 0 ? "+" : ""}
            {selectedStock.priceModifier} TL
          </span>
        )}
      </div>
    </div>
  );
}
