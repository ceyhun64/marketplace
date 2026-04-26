"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

// Simple local wishlist state (in a real app, this would be in Zustand/backend)
const MOCK_WISHLIST = [
  {
    id: "1",
    offerId: "offer-1",
    productId: "p1",
    productName: "Premium Wireless Headphones",
    productImage: "",
    price: 1299.9,
    merchantId: "m1",
    merchantStoreName: "TechStore",
    merchantSlug: "techstore",
    stock: 10,
    source: "MARKETPLACE" as const,
  },
  {
    id: "2",
    offerId: "offer-2",
    productId: "p2",
    productName: "Leather Minimalist Wallet",
    productImage: "",
    price: 349.0,
    merchantId: "m2",
    merchantStoreName: "StyleHub",
    merchantSlug: "stylehub",
    stock: 5,
    source: "ESTORE" as const,
  },
  {
    id: "3",
    offerId: "offer-3",
    productId: "p3",
    productName: "Ceramic Pour-Over Coffee Set",
    productImage: "",
    price: 520.0,
    merchantId: "m3",
    merchantStoreName: "HomeGoods",
    merchantSlug: "homegoods",
    stock: 3,
    source: "MARKETPLACE" as const,
  },
];

export default function WishlistPage() {
  const { addItem, hasItem } = useCart();
  const [wishlist, setWishlist] = useState(MOCK_WISHLIST);

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddToCart = (item: (typeof MOCK_WISHLIST)[0]) => {
    addItem({
      offerId: item.offerId,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: item.price,
      merchantId: item.merchantId,
      merchantStoreName: item.merchantStoreName,
      merchantSlug: item.merchantSlug,
      stock: item.stock,
      source: item.source,
    });
  };

  return (
    <main className="min-h-screen  py-12 px-4">
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-7 h-7 text-[var(--red)]" fill="currentColor" />
            <h1 className="text-4xl font-heading font-bold text-[var(--charcoal)]">
              Wishlist
            </h1>
          </div>
          <p className="text-[var(--charcoal-soft)]">
            {wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
            <Heart className="w-16 h-16 text-[var(--charcoal)]/10 mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-bold text-[var(--charcoal)] mb-3">
              Your wishlist is empty
            </h2>
            <p className="text-[var(--charcoal-soft)] mb-8 max-w-sm mx-auto">
              Save your favorite products here to easily find them later.
            </p>
            <Button
              asChild
              className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white font-bold px-8 h-12"
            >
              <Link href="/products">Discover Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 group"
              >
                {/* Image */}
                <div className="aspect-square  relative flex items-center justify-center">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-[var(--charcoal)]/20" />
                  )}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[var(--red)] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--red)] hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <Link
                    href={`/store/${item.merchantSlug}`}
                    className="text-xs font-mono text-[var(--charcoal-mid)] font-bold uppercase tracking-wider hover:underline"
                  >
                    {item.merchantStoreName}
                  </Link>
                  <h3 className="font-bold text-[var(--charcoal)] mt-1 mb-3 leading-tight">
                    {item.productName}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-heading text-[var(--charcoal)]">
                      ₺{item.price.toFixed(2)}
                    </span>
                    <Button
                      onClick={() => handleAddToCart(item)}
                      disabled={hasItem(item.offerId)}
                      className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white text-xs font-bold px-5 h-9 transition-all disabled:opacity-60"
                    >
                      {hasItem(item.offerId) ? "In Cart ✓" : "Add to Cart"}
                    </Button>
                  </div>

                  {item.stock <= 3 && (
                    <p className="text-xs text-[var(--red)] font-semibold mt-2">
                      Only {item.stock} left!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {wishlist.length > 0 && (
          <div className="mt-8 flex justify-end">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors"
            >
              View Cart
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
