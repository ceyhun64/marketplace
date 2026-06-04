"use client";

import { Package } from "lucide-react";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/entities";

interface CategoryProductGridProps {
  products: Product[];
}

export function CategoryProductGrid({ products }: CategoryProductGridProps) {
  const { addItem } = useCart();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--off-white-2)" }}
        >
          <Package className="w-6 h-6" style={{ color: "var(--charcoal-mist)" }} />
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--charcoal)" }}>
          No products found
        </p>
        <p className="text-xs" style={{ color: "var(--charcoal-mist)" }}>
          Try a different subcategory or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          context="marketplace"
          onAddToCart={() =>
            addItem({
              offerId: product.id,
              productId: product.id,
              productName: product.name,
              productImage: product.images?.[0] ?? "",
              merchantId: product.merchantId,
              merchantStoreName: product.merchantStoreName,
              merchantSlug: product.merchantSlug,
              price: product.price,
              stock: product.stock,
              source: "MARKETPLACE",
            })
          }
        />
      ))}
    </div>
  );
}
