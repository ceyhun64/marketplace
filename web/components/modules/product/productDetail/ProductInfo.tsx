"use client";

import React from "react";
import Image from "next/image";
import { Star, ArrowLeft, ChevronRight } from "lucide-react";
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
  brand: { id: string | number; name: string; image: string | null } | null;
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
  selectedStock: StockEntry | null;
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
        <nav
          className="flex items-center gap-2 flex-wrap"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <Link
            href="/products"
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: "#9a9a9a",
              transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c8102e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9a9a")}
          >
            <ArrowLeft size={11} /> Collection
          </Link>

          {category && (
            <>
              <ChevronRight size={9} style={{ color: "#9a9a9a" }} />
              <Link
                href={`/products/category/${category.id}`}
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  color: "#9a9a9a",
                  transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#c8102e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9a9a")}
              >
                {category.name}
              </Link>

              {middleCategory && (
                <>
                  <ChevronRight size={9} style={{ color: "#9a9a9a" }} />
                  <Link
                    href={`/products/category/${category.id}/${middleCategory.id}`}
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: "#9a9a9a",
                      transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#c8102e")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#9a9a9a")
                    }
                  >
                    {middleCategory.name}
                  </Link>
                </>
              )}

              {subCategory && (
                <>
                  <ChevronRight size={9} style={{ color: "#9a9a9a" }} />
                  <Link
                    href={`/products/category/${category.id}/${middleCategory?.id}/${subCategory.id}`}
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: "#9a9a9a",
                      transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#c8102e")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#9a9a9a")
                    }
                  >
                    {subCategory.name}
                  </Link>
                </>
              )}
            </>
          )}

          <ChevronRight size={9} style={{ color: "#9a9a9a" }} />
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "#c8102e" }}
          >
            Product Detail
          </span>
        </nav>
      </div>

      {/* Header */}
      <header className="space-y-4">
        {/* Category + Brand + ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: "rgba(200,16,46,0.07)",
                border: "1px solid rgba(200,16,46,0.18)",
                color: "#c8102e",
                borderRadius: "4px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {category.name}
            </span>
            <span
              className="text-[10px]"
              style={{
                color: "#9a9a9a",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              PRO-{id}
            </span>
          </div>

          {brand && (
            <div className="flex items-center gap-2">
              {brand.image && (
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={22}
                  height={22}
                  className="object-contain"
                />
              )}
              <span
                className="text-xs font-semibold"
                style={{ color: "#525252" }}
              >
                {brand.name}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight"
          style={{
            color: "#1e1e1e",
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
          {hasCustomImage && (
            <span
              className="ml-2 text-sm font-normal"
              style={{ color: "#c8102e" }}
            >
              (Customized)
            </span>
          )}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  fill={i < Math.round(rating) ? "#c8102e" : "none"}
                  color={i < Math.round(rating) ? "#c8102e" : "#e6e4e1"}
                />
              ))}
            </div>
            <span
              className="text-sm font-bold"
              style={{
                color: "#1e1e1e",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs" style={{ color: "#9a9a9a" }}>
            ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
          </span>
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {inStock ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
              style={{
                background: "rgba(13,122,78,0.07)",
                border: "1px solid rgba(13,122,78,0.18)",
                color: "#0d7a4e",
                borderRadius: "999px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#0d7a4e" }}
              />
              In Stock
              {lowStock && (
                <span style={{ color: "#b45309" }}>
                  &nbsp;· Only {stockQuantity} left
                </span>
              )}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
              style={{
                background: "rgba(200,16,46,0.07)",
                border: "1px solid rgba(200,16,46,0.18)",
                color: "#c8102e",
                borderRadius: "999px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#c8102e" }}
              />
              Out of Stock
            </span>
          )}
        </div>
      </header>

      {/* Price */}
      <div
        className="flex flex-col py-4"
        style={{
          borderTop: "1px solid rgba(30,30,30,0.06)",
          borderBottom: "1px solid rgba(30,30,30,0.06)",
        }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="text-3xl font-black tracking-tighter"
            style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
          >
            {currentPrice.toLocaleString("en-US")}
            <small
              className="text-sm ml-1"
              style={{ color: "#747474", fontWeight: 600 }}
            >
              USD
            </small>
          </span>

          {hasDiscount && (
            <>
              <span
                className="text-lg line-through font-semibold"
                style={{ color: "#9a9a9a" }}
              >
                {oldPrice?.toLocaleString("en-US")} USD
              </span>
              <span
                className="px-2 py-1 text-xs font-bold"
                style={{
                  background: "#c8102e",
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>

        {selectedStock && selectedStock.priceModifier !== 0 && (
          <span
            className="text-xs mt-2"
            style={{
              color: "#747474",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Selected size modifier:{" "}
            <span
              style={{
                color: selectedStock.priceModifier > 0 ? "#b45309" : "#0d7a4e",
                fontWeight: 700,
              }}
            >
              {selectedStock.priceModifier > 0 ? "+" : ""}
              {selectedStock.priceModifier.toLocaleString("en-US")} USD
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
