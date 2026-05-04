import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/modules/store/ProductCard";

interface Product {
  id: number;
  title: string;
  price: number;
  oldPrice: number | null;
  mainImage: string;
  category: string;
  brand?: string | null;
  hasDiscount: boolean;
}

interface ProductCarouselProps {
  products: Product[];
  title: string;
  icon: React.ReactNode;
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
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all group"
            aria-label="Önceki"
          >
            <ChevronLeft
              size={20}
              className="text-slate-600 group-hover:text-orange-600 transition-colors"
            />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all group"
            aria-label="Sonraki"
          >
            <ChevronRight
              size={20}
              className="text-slate-600 group-hover:text-orange-600 transition-colors"
            />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-[calc(50%-8px)] md:w-[calc(25%-12px)] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
