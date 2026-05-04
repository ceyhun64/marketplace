"use client";

import Link from "next/link";
import { ShoppingCart, Store, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/entities";
import { WishlistButton } from "@/components/modules/store/WishlistButton";

interface ProductCardProps {
  product: Product;
  context?: "marketplace" | "store";
  storeSlug?: string;
  onAddToCart?: (product: Product) => void;
  className?: string;
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

  const coverImage = product.images?.[0] ?? null;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1",
        className,
      )}
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(51,51,51,0.08)",
        boxShadow: "0 1px 3px rgba(51,51,51,0.06)",
      }}
    >
      {/* Red top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10"
        style={{ background: "var(--red)" }}
      />

      {/* Image */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden"
        style={{ background: "var(--off-white)" }}
      >
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
              isOutOfStock && "opacity-60 grayscale",
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart
              className="w-10 h-10"
              style={{ color: "rgba(51,51,51,0.1)" }}
            />
          </div>
        )}

        {isOutOfStock && (
          <div
            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ background: "rgba(245,245,243,0.7)" }}
          >
            <span
              className="rounded-full px-3 py-1 text-xs font-mono font-medium"
              style={{
                background: "rgba(51,51,51,0.08)",
                color: "var(--charcoal-soft)",
                letterSpacing: "0.05em",
              }}
            >
              Out of Stock
            </span>
          </div>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                style={{
                  background: "rgba(200,16,46,0.08)",
                  color: "var(--red)",
                  border: "1px solid rgba(200,16,46,0.15)",
                  letterSpacing: "0.05em",
                }}
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Wishlist icon */}
        <div className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            variant="icon"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {context === "marketplace" && product.merchantStoreName && (
          <Link
            href={`/store/${product.merchantSlug}`}
            className="flex items-center gap-1 text-[11px] font-mono transition-colors"
            style={{ color: "var(--charcoal-soft)", letterSpacing: "0.05em" }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--charcoal-soft)")
            }
          >
            <Store className="h-3 w-3" />
            {product.merchantStoreName}
          </Link>
        )}

        <Link href={href}>
          <h3
            className="line-clamp-2 text-[0.875rem] font-bold leading-snug transition-colors text-[var(--charcoal)]"
            style={{ fontFamily: "var(--font-body)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--charcoal))")
            }
          >
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span
            className="text-base font-bold text-[var(--charcoal)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product.price.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
            })}
          </span>

          {onAddToCart && (
            <button
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border transition-all"
              style={{
                border: "1.5px solid rgba(51,51,51,0.15)",
                color: "var(--charcoal)",
                background: "transparent",
              }}
              disabled={isOutOfStock}
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              aria-label="Sepete ekle"
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
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {product.stock > 0 && product.stock <= 5 && (
          <p
            className="font-mono text-[10px] font-medium"
            style={{ color: "var(--red)", letterSpacing: "0.05em" }}
          >
            Son {product.stock} adet!
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
