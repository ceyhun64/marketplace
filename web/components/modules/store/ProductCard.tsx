"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Store, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/entities";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  /**
   * "marketplace" → /product/[id]
   * "store"       → /store/[slug]/product/[id]
   */
  context?: "marketplace" | "store";
  storeSlug?: string;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

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

  const coverImage = product.images[0] ?? "/placeholder-product.png";
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      {/* Görsel */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden"
      >
        <Image
          src={coverImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-105",
            isOutOfStock && "opacity-60 grayscale",
          )}
        />

        {/* Stok bitti rozeti */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Tükendi
            </span>
          </div>
        )}

        {/* Etiket rozeti — max 2 adet */}
        {product.tags.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 backdrop-blur-sm"
              >
                <Tag className="mr-0.5 h-2.5 w-2.5" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </Link>

      {/* Bilgiler */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Mağaza adı (marketplace context'inde göster) */}
        {context === "marketplace" && product.merchantStoreName && (
          <Link
            href={`/store/${product.merchantSlug}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Store className="h-3 w-3" />
            {product.merchantStoreName}
          </Link>
        )}

        {/* Ürün adı */}
        <Link href={href}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
            {product.name}
          </h3>
        </Link>

        {/* Fiyat + Sepet */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-semibold tabular-nums">
            {product.price.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
            })}
          </span>

          {onAddToCart && (
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              aria-label="Sepete ekle"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Stok uyarısı — az kaldıysa */}
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Son {product.stock} adet!
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
