"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ArrowRight, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

interface RecentProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  merchantStoreName?: string;
}

const STORAGE_KEY = "bazr_recently_viewed";
const MAX_ITEMS = 6;

// Utility to get/save recently viewed from localStorage
export function trackProductView(product: RecentProduct) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: RecentProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((p) => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("bazr:recentlyViewed"));
  } catch {}
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([]);

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener("bazr:recentlyViewed", load);
    return () => window.removeEventListener("bazr:recentlyViewed", load);
  }, []);

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  };

  return { items, clear };
}

function recentToProduct(p: RecentProduct): Product {
  return {
    id:               p.id,
    name:             p.name,
    price:            p.price,
    images:           p.images ?? [],
    merchantStoreName: p.merchantStoreName,
    merchantSlug:     "",
    merchantId:       "",
    description:      "",
    categoryId:       "",
    tags:             [],
    stock:            99,
    isApproved:       true,
    isDeleted:        false,
    publishToMarket:  true,
    publishToStore:   true,
    createdAt:        "",
  };
}

export default function RecentlyViewed() {
  const { items, clear } = useRecentlyViewed();
  const cart = useCart();

  if (items.length === 0) return null;

  return (
    <section style={{ padding: "4rem 0", background: "var(--off-white-2)" }}>
      <div className="max-w-325 mx-auto px-4 sm:px-8">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--white)",
                border: "1px solid var(--border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} color="var(--charcoal-soft)" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  color: "var(--charcoal)",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Recently Viewed
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--charcoal-mist)",
                  margin: "2px 0 0",
                }}
              >
                {items.length} item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={clear}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                background: "none",
                border: "none",
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--charcoal-mist)",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "color 0.15s ease",
              }}
            >
              <X size={13} />
              Clear
            </button>
            <Link
              href="/products"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--charcoal)",
                textDecoration: "none",
              }}
            >
              Browse more <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Products row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={recentToProduct(product)}
              context="marketplace"
              onAddToCart={(prod) => {
                cart.addItem({
                  offerId:    prod.id,
                  productId:  prod.id,
                  productName: prod.name,
                  productImage: prod.images?.[0],
                  merchantId: prod.merchantId,
                  stock:      prod.stock,
                  price:      prod.price,
                });
                toast.success("Added to cart", { duration: 2000 });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// -- RecentlyViewedSection — inline section for product detail page -------------

export function RecentlyViewedSection({
  currentProductId,
}: {
  currentProductId: string;
}) {
  const { items } = useRecentlyViewed();

  const filtered = items.filter((p) => p.id !== currentProductId).slice(0, 4);
  if (filtered.length === 0) return null;

  return (
    <section className="mt-12">
      <div
        className="flex items-center gap-3 mb-6"
        style={{
          borderTop: "1px solid rgba(30,30,30,0.06)",
          paddingTop: "2rem",
        }}
      >
        <Clock size={18} style={{ color: "#c8102e" }} />
        <h2
          className="text-base font-black uppercase tracking-tighter"
          style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
        >
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={recentToProduct(product)}
            context="marketplace"
          />
        ))}
      </div>
    </section>
  );
}
