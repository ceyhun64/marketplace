"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

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

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
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
            <div
              key={product.id}
              style={{
                background: "var(--white)",
                borderRadius: 16,
                border: "1px solid var(--border-light)",
                overflow: "hidden",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                boxShadow: "0 1px 4px rgba(30,30,30,0.05)",
              }}
              className="group hover:shadow-md hover:-translate-y-0.5"
            >
              <Link
                href={`/product/${product.id}`}
                style={{ textDecoration: "none" }}
              >
                {/* Image */}
                <div
                  style={{
                    height: 160,
                    background: "var(--off-white)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 40 }}>📦</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "0.875rem" }}>
                  {product.merchantStoreName && (
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.5625rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--red)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {product.merchantStoreName}
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--charcoal)",
                      lineHeight: 1.35,
                      marginBottom: "0.5rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.0625rem",
                      fontWeight: 500,
                      color: "var(--charcoal)",
                    }}
                  >
                    {formatPrice(product.price)}
                  </div>
                </div>
              </Link>

              {/* Add to cart */}
              <div style={{ padding: "0 0.875rem 0.875rem" }}>
                <button
                  onClick={() => {
                    cart.addItem({
                      offerId: product.id,
                      productId: product.id,
                      productName: product.name,
                      productImage: product.images?.[0],
                      merchantId: "",
                      stock: 99,
                      price: product.price,
                    });
                    toast.success("Added to cart", { duration: 2000 });
                  }}
                  style={{
                    width: "100%",
                    background: "var(--charcoal)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.5rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  className="hover:bg-[var(--red)]"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── RecentlyViewedSection — inline section for product detail page ─────────────

export function RecentlyViewedSection({
  currentProductId,
}: {
  currentProductId: string;
}) {
  const { items } = useRecentlyViewed();
  const cart = useCart();

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
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group block"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(30,30,30,0.1)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
              transition: "box-shadow 140ms cubic-bezier(0.16,1,0.3,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 16px rgba(30,30,30,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 1px 4px rgba(30,30,30,0.06)";
            }}
          >
            <div
              className="relative w-full"
              style={{ aspectRatio: "1/1", background: "#f5f5f5" }}
            >
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={28} style={{ color: "#e6e4e1" }} />
                </div>
              )}
            </div>
            <div className="p-3 space-y-1">
              {product.merchantStoreName && (
                <div
                  className="text-[9px] uppercase tracking-widest font-bold truncate"
                  style={{
                    color: "#9a9a9a",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {product.merchantStoreName}
                </div>
              )}
              <div
                className="text-xs font-bold leading-snug"
                style={{
                  color: "#1e1e1e",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {product.name}
              </div>
              <div className="text-sm font-black" style={{ color: "#c8102e" }}>
                {formatPrice(product.price)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
