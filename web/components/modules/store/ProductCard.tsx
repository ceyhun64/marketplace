"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Store, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/entities";
import { WishlistButton } from "@/components/modules/store/WishlistButton";
import { useCompareStore } from "@/hooks/use-compare";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface ProductCardProps {
  product: Product;
  context?: "marketplace" | "store";
  storeSlug?: string;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

// Deterministic local fallback images from /public/products/
const LOCAL_PRODUCT_IMAGES = [
  "/products/product1.webp",
  "/products/product2.webp",
  "/products/product3.webp",
  "/products/product4.webp",
  "/products/product5.webp",
  "/products/product6.webp",
];

function getLocalFallback(productId: string): string {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) & 0xffffffff;
  }
  return LOCAL_PRODUCT_IMAGES[Math.abs(hash) % LOCAL_PRODUCT_IMAGES.length];
}

export function ProductCard({
  product,
  context = "marketplace",
  storeSlug,
  onAddToCart,
  className,
}: ProductCardProps) {
  const href =
    context === "store" && storeSlug
      ? `/store/${storeSlug}/product/${product.id}`
      : `/product/${product.id}`;

  const coverImage =
    product.images?.[0] && product.images[0].trim() !== ""
      ? product.images[0]
      : getLocalFallback(product.id);

  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={cn(
        // Card shell — hover lifts slightly; group enables child group-hover: variants
        "group relative flex flex-col overflow-hidden bg-white transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-(--shadow-md)",
        className,
      )}
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Brand red sweep — slides in from left on card hover */}
      <div
        className="absolute inset-x-0 top-0 h-0.75 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10"
        style={{ background: "var(--red)" }}
      />

      {/* -- Product image ------------------------------------------------------ */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={product.name}
          className={cn(
            "w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105",
            isOutOfStock && "opacity-60 grayscale",
          )}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            const fallback = getLocalFallback(product.id);
            if (!el.src.includes("/products/product")) el.src = fallback;
          }}
        />

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div
            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ background: "rgba(245,245,243,0.7)" }}
          >
            <span
              className="rounded-full px-3 py-1 text-xs font-mono font-medium tracking-wide"
              style={{
                background: "rgba(51,51,51,0.08)",
                color: "var(--charcoal-soft)",
              }}
            >
              Out of Stock
            </span>
          </div>
        )}

        {/* Tag badges */}
        {product.tags && product.tags.length > 0 && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide"
                style={{
                  background: "rgba(200,16,46,0.08)",
                  color: "var(--red)",
                  border: "1px solid rgba(200,16,46,0.15)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Action buttons — outside Link so clicks don't trigger navigation */}
      <div className="absolute right-2.5 top-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-1.5">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          variant="icon"
        />
        <CompareIconButton product={product} />
      </div>

      {/* -- Info --------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {/* Store name */}
        {context === "marketplace" && product.merchantStoreName && (
          <Link
            href={`/store/${product.merchantSlug}`}
            className="flex items-center gap-1 text-[11px] font-mono tracking-wide transition-colors hover:text-(--red)"
            style={{ color: "var(--charcoal-soft)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Store className="h-3 w-3 shrink-0" />
            {product.merchantStoreName}
          </Link>
        )}

        {/* Product title — Tailwind hover instead of JS event handlers */}
        <Link href={href} className="group/title block">
          <h3
            className={cn(
              "line-clamp-2 text-sm font-bold leading-snug transition-colors duration-150",
              "text-(--charcoal) group-hover/title:text-(--red)",
            )}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Price + add-to-cart */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-(--charcoal) num">
            {formatPrice(product.price)}
          </span>

          {onAddToCart && (
            <button
              // Min 44 × 44 px touch target on mobile, 36 × 36 on desktop
              className={cn(
                "h-11 w-11 sm:h-9 sm:w-9 shrink-0",
                "flex items-center justify-center rounded-lg",
                "border transition-all duration-150",
                "border-[rgba(51,51,51,0.15)] bg-transparent text-(--charcoal)",
                "hover:bg-(--red) hover:border-(--red) hover:text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[rgba(51,51,51,0.15)] disabled:hover:text-(--charcoal)",
              )}
              disabled={isOutOfStock}
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Low-stock nudge */}
        {product.stock > 0 && product.stock <= 5 && (
          <p
            className="font-mono text-[10px] font-medium tracking-wide"
            style={{ color: "var(--red)" }}
          >
            Only {product.stock} left!
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductCard;

// -- Compare icon button (used inside ProductCard image overlay) ----------------
function CompareIconButton({ product }: { product: Product }) {
  const router = useRouter();
  const { toggle, isInCompare } = useCompareStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const inCompare = mounted && isInCompare(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const added = toggle({
      id:           product.id,
      name:         product.name,
      images:       product.images ?? [],
      price:        product.price,
      rating:       0,
      reviewCount:  0,
      stock:        { inStock: product.stock > 0, quantity: product.stock },
      categoryName: product.categoryName ?? "",
      merchantName: product.merchantStoreName ?? "",
      merchantSlug: product.merchantSlug,
      merchantId:   product.merchantId,
      tags:         product.tags ?? [],
      specifications: {},
      shipping:     { freeShipping: false },
    });

    if (!added && inCompare) {
      toast.success(`Removed from compare`);
    } else if (added) {
      toast.success("Added to compare", {
        action: { label: "Compare Now", onClick: () => router.push("/compare") },
      });
    } else {
      toast.error("You can compare up to 3 products.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={inCompare ? "Remove from compare" : "Add to compare"}
      title={inCompare ? "Remove from compare" : "Add to compare"}
      className="relative flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all duration-200"
      style={{
        background:  inCompare ? "rgba(200,16,46,0.1)" : "rgba(255,255,255,0.9)",
        border:      inCompare ? "1px solid rgba(200,16,46,0.35)" : "1px solid rgba(30,30,30,0.15)",
        backdropFilter: "blur(4px)",
      }}
    >
      <GitCompare
        className="w-4 h-4"
        style={{ color: inCompare ? "var(--red)" : "var(--charcoal-mist)" }}
      />
    </button>
  );
}
