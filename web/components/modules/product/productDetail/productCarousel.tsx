import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

export interface CarouselProduct {
  id: number | string;
  title?: string;
  name?: string;
  price: number;
  oldPrice?: number | null;
  mainImage?: string;
  images?: string[];
  category?: string | { id: number; name: string };
  brand?: string | null;
  hasDiscount?: boolean;
  stock?: number;
  merchantStoreName?: string;
  merchantSlug?: string;
  tags?: string[];
}

interface ProductCarouselProps {
  products: CarouselProduct[];
  title: string;
  icon: React.ReactNode;
}

function toProduct(p: CarouselProduct): Product {
  return {
    id: String(p.id),
    merchantId: "",
    merchantStoreName: p.merchantStoreName ?? "",
    merchantSlug: p.merchantSlug ?? "",
    name: p.name ?? p.title ?? "",
    description: "",
    categoryId: "",
    categoryName:
      typeof p.category === "string" ? p.category : (p.category?.name ?? ""),
    images:
      p.images && p.images.length > 0
        ? p.images
        : p.mainImage
          ? [p.mainImage]
          : [],
    tags: p.tags ?? [],
    price: p.price,
    stock: p.stock ?? 1,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  };
}

export default function ProductCarousel({
  products,
  title,
  icon,
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    container.scrollBy({
      left:
        direction === "left"
          ? -container.offsetWidth * 0.8
          : container.offsetWidth * 0.8,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <div
      className="mt-12 pt-8"
      style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
    >
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon}
          <h2
            className="text-lg font-extrabold uppercase tracking-tight"
            style={{
              color: "#1e1e1e",
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            aria-label="Önceki"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              border: "1.5px solid rgba(30,30,30,0.18)",
              borderRadius: "8px",
              color: "#747474",
              transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#c8102e";
              e.currentTarget.style.color = "#c8102e";
              e.currentTarget.style.background = "rgba(200,16,46,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
              e.currentTarget.style.color = "#747474";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Sonraki"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              border: "1.5px solid rgba(30,30,30,0.18)",
              borderRadius: "8px",
              color: "#747474",
              transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#c8102e";
              e.currentTarget.style.color = "#c8102e";
              e.currentTarget.style.background = "rgba(200,16,46,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
              e.currentTarget.style.color = "#747474";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Kaydırmalı Liste */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-none snap-start"
            style={{ width: "calc(50% - 8px)" }}
          >
            <ProductCard product={toProduct(product)} />
          </div>
        ))}
      </div>
    </div>
  );
}
