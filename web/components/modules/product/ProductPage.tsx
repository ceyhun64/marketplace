"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/queries/useProducts";
import { trackProductView } from "@/components/modules/home/RecentlyViewed";
import {
  Info,
  Eye,
  ShoppingCart,
  Award,
  BadgeCheck,
  ShieldCheck,
  HardHat,
  TrendingUp,
  Users,
  Percent,
  Heart,
  Tag,
  Store,
  Globe,
  Truck,
  Zap,
  RotateCcw,
  Lock,
  Star,
  GitCompare,
  Clock,
  Package,
  CheckCircle2,
  CalendarDays,
  AlertTriangle,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { RecentlyViewedSection } from "@/components/modules/home/RecentlyViewed";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ProductTabs from "@/components/modules/product/productDetail/ProductTabs";
import ProductDetailSkeleton from "@/components/modules/product/productDetail/ProductDetailSkeleton";
import ProductImageGallery from "@/components/modules/product/productDetail/ProductImageGallery";
import ProductInfo from "@/components/modules/product/productDetail/ProductInfo";
import ProductVariantSelector from "@/components/modules/product/productDetail/ProductVariantSelector";
import ProductActions from "@/components/modules/product/productDetail/ProductActions";
import ProductCarousel from "@/components/modules/product/productDetail/ProductCarousel";
import OtherSellers from "@/components/modules/product/productDetail/OtherSellers";
import { useHybridWishlist } from "@/hooks/use-hybrid-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Size {
  id: number;
  value: string;
  type: string;
  sortOrder: number;
}

interface StockEntry {
  id: number;
  sizeId: number | null;
  stock: number;
  priceModifier: number;
}

/** Matches ProductVariant entity (JSONB attributes, per-variant stock & price). */
interface Variant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  priceOverride: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number | null;
  discountPercentage: number;
  hasDiscount: boolean;
  discountAmount: number;
  mainImage: string;
  images: string[];
  videoUrl: string | null;
  category: { id: number; name: string; slug?: string };
  middleCategory: { id: number; name: string; slug?: string } | null;
  subCategory: { id: number; name: string; slug?: string } | null;
  tags: string[];
  brand: {
    id: string;
    name: string;
    slug?: string;
    image: string | null;
    customDomain?: string | null;
    handlingHours?: number;
  } | null;
  color: { id: number; name: string; hexCode: string } | null;
  productGroupId: string | null;
  otherColors: Array<{
    id: number;
    title: string;
    price: number;
    oldPrice: number | null;
    mainImage: string;
    color: { id: number; name: string; hexCode: string } | null;
    hasDiscount: boolean;
    discountPercentage: number;
  }>;
  rating: number;
  reviewCount: number;
  ratingDistribution: Record<number, number>;
  reviews: Array<{
    id: number;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: string;
    user: { name: string; surname: string };
  }>;
  stock: { inStock: boolean; quantity: number; lowStock: boolean };
  publishToMarket: boolean;
  publishToStore: boolean;
  isApproved: boolean;
  shipping: {
    freeShipping: boolean;
    estimatedDelivery: string;
    shippingCost: number;
    expressAvailable: boolean;
    expressDelivery: string;
    expressCost: number;
  };
  specifications: {
    weight: string | null;
    dimensions: string | null;
    material: string | null;
    warranty: string;
    origin: string;
    certifications: string[];
  };
  relatedProducts: Array<{
    id: number;
    title: string;
    price: number;
    oldPrice: number | null;
    mainImage: string;
    category: string;
    brand: string | null;
    hasDiscount: boolean;
  }>;
  brandProducts: Array<{
    id: number;
    title: string;
    price: number;
    oldPrice: number | null;
    mainImage: string;
    category: string;
    hasDiscount: boolean;
  }>;
  meta: {
    views: number;
    favorites: number;
    purchaseCount: number;
    lastUpdated: string;
  };
  availableSizes: Size[];
  stockMatrix: StockEntry[];
  bulkDiscountQty: number | null;
  bulkDiscountRate: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API hook — product variants
// ─────────────────────────────────────────────────────────────────────────────

function useProductVariants(productId: string) {
  return useQuery<Variant[]>({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data } = await api.get(`/api/products/${productId}/variants`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DynamicVariantSelector — JSONB variant matrix selector
// ─────────────────────────────────────────────────────────────────────────────

interface DynamicVariantSelectorProps {
  variants: Variant[];
  basePrice: number;
  onVariantChange: (variant: Variant | null) => void;
}

function DynamicVariantSelector({
  variants,
  basePrice,
  onVariantChange,
}: DynamicVariantSelectorProps) {
  const active = variants.filter((v) => v.isActive);

  const axes = useMemo(() => {
    const s = new Set<string>();
    active.forEach((v) => Object.keys(v.attributes).forEach((k) => s.add(k)));
    return Array.from(s);
  }, [active]);

  const [sel, setSel] = useState<Record<string, string>>({});

  const matched = useMemo(() => {
    if (axes.length === 0) return null;
    if (axes.some((a) => !sel[a])) return null;
    return (
      active.find((v) => axes.every((a) => v.attributes[a] === sel[a])) ?? null
    );
  }, [sel, active, axes]);

  useEffect(() => {
    onVariantChange(matched);
  }, [matched]);

  if (axes.length === 0) return null;

  const isValueAvailable = (axis: string, value: string) =>
    active.some(
      (v) =>
        v.attributes[axis] === value &&
        v.stock > 0 &&
        axes
          .filter((a) => a !== axis)
          .every((a) => !sel[a] || v.attributes[a] === sel[a]),
    );

  const isColorAxis = (axis: string) =>
    axis.toLowerCase() === "color" || axis.toLowerCase() === "colour";

  return (
    <div className="space-y-5">
      {axes.map((axis) => {
        const values = Array.from(
          new Set(active.map((v) => v.attributes[axis]).filter(Boolean)),
        );

        return (
          <div key={axis}>
            <div className="flex items-center justify-between mb-2.5">
              <span
                className="text-[10px] font-black uppercase tracking-[0.18em]"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {axis}
              </span>
              {sel[axis] && (
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--charcoal)" }}
                >
                  {sel[axis]}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const available = isValueAvailable(axis, val);
                const selected = sel[axis] === val;

                if (isColorAxis(axis)) {
                  return (
                    <button
                      key={val}
                      type="button"
                      title={val}
                      disabled={!available}
                      onClick={() => setSel((p) => ({ ...p, [axis]: val }))}
                      className="relative w-8 h-8 rounded-full transition-all"
                      style={{
                        background: val.startsWith("#") ? val : undefined,
                        backgroundColor: !val.startsWith("#")
                          ? "var(--off-white-2)"
                          : undefined,
                        border: selected
                          ? "3px solid var(--charcoal)"
                          : "2px solid var(--border-mid)",
                        opacity: available ? 1 : 0.35,
                        cursor: available ? "pointer" : "not-allowed",
                        boxShadow: selected
                          ? "0 0 0 2px white, 0 0 0 4px var(--charcoal)"
                          : undefined,
                      }}
                    >
                      {!val.startsWith("#") && (
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {val.slice(0, 2)}
                        </span>
                      )}
                      {!available && (
                        <span
                          className="absolute inset-0 flex items-center justify-center rounded-full"
                          style={{ background: "rgba(255,255,255,0.6)" }}
                        >
                          <span
                            className="block w-5 border-t rotate-45"
                            style={{ borderColor: "var(--danger)" }}
                          />
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={val}
                    type="button"
                    disabled={!available}
                    onClick={() => setSel((p) => ({ ...p, [axis]: val }))}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: selected ? "var(--charcoal)" : "white",
                      color: selected
                        ? "white"
                        : available
                          ? "var(--charcoal)"
                          : "var(--text-tertiary)",
                      borderColor: selected
                        ? "var(--charcoal)"
                        : available
                          ? "var(--border-mid)"
                          : "var(--border-light)",
                      opacity: available ? 1 : 0.5,
                      cursor: available ? "pointer" : "not-allowed",
                      textDecoration: available ? undefined : "line-through",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Matched variant feedback row */}
      {axes.every((a) => !!sel[a]) && (
        <div
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl"
          style={{
            background: matched
              ? matched.stock > 0
                ? "rgba(13,122,78,0.07)"
                : "rgba(200,16,46,0.07)"
              : "var(--off-white-2)",
            border: `1px solid ${
              matched
                ? matched.stock > 0
                  ? "rgba(13,122,78,0.18)"
                  : "rgba(200,16,46,0.18)"
                : "var(--border-light)"
            }`,
          }}
        >
          {matched ? (
            <>
              <div className="flex items-center gap-2">
                {matched.stock > 0 ? (
                  <CheckCircle2
                    size={13}
                    style={{ color: "var(--success)", flexShrink: 0 }}
                  />
                ) : (
                  <AlertTriangle
                    size={13}
                    style={{ color: "var(--danger)", flexShrink: 0 }}
                  />
                )}
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      matched.stock > 0 ? "var(--success)" : "var(--danger)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {matched.stock > 0
                    ? matched.stock <= 5
                      ? `Only ${matched.stock} left — order soon!`
                      : "In Stock"
                    : "Out of Stock"}
                </span>
                <span
                  className="text-[10px]"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  SKU: {matched.sku}
                </span>
              </div>
              {matched.priceOverride !== null &&
                matched.priceOverride !== basePrice && (
                  <span
                    className="text-sm font-black"
                    style={{
                      color: "var(--red)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    ${matched.priceOverride.toFixed(2)}
                  </span>
                )}
            </>
          ) : (
            <span
              className="text-xs"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
              }}
            >
              Select all options to check availability
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeliveryEstimate — dynamic "order by X, receive by Y"
// ─────────────────────────────────────────────────────────────────────────────

function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

function DeliveryEstimate({ handlingHours = 24 }: { handlingHours?: number }) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(15, 0, 0, 0); // 3PM cutoff
  const isBeforeCutoff = now < cutoff;
  const base = isBeforeCutoff ? now : new Date(now.getTime() + 86_400_000);

  const handlingDays = Math.ceil(handlingHours / 24);
  const standardDate = addBusinessDays(base, handlingDays + 3);
  const expressDate = addBusinessDays(base, handlingDays + 1);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const hoursLeft = Math.max(
    0,
    Math.floor((cutoff.getTime() - now.getTime()) / 3_600_000),
  );

  return (
    <div
      className="p-4 space-y-3 rounded-xl"
      style={{
        background: "white",
        border: "1px solid rgba(30,30,30,0.1)",
        boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
      }}
    >
      <div
        className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
        style={{
          color: "var(--charcoal-mist)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <CalendarDays size={13} style={{ color: "var(--red)" }} />
        Estimated Delivery
      </div>

      {isBeforeCutoff && hoursLeft > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: "rgba(200,16,46,0.07)",
            border: "1px solid rgba(200,16,46,0.15)",
          }}
        >
          <Clock size={12} style={{ color: "var(--red)" }} />
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
          >
            Order within {hoursLeft}h to meet today's cut-off
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-md"
              style={{ background: "rgba(13,122,78,0.08)" }}
            >
              <Package size={13} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <p
                className="text-xs font-bold"
                style={{ color: "var(--charcoal)" }}
              >
                Standard
              </p>
              <p
                className="text-[10px]"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                3–5 business days
              </p>
            </div>
          </div>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--success)" }}
          >
            by {fmt(standardDate)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-md"
              style={{ background: "rgba(200,16,46,0.08)" }}
            >
              <Zap size={13} style={{ color: "var(--red)" }} />
            </div>
            <div>
              <p
                className="text-xs font-bold"
                style={{ color: "var(--charcoal)" }}
              >
                Express
              </p>
              <p
                className="text-[10px]"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                1–2 business days
              </p>
            </div>
          </div>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--charcoal)" }}
          >
            by {fmt(expressDate)}
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: "1px dashed rgba(30,30,30,0.1)" }}
      >
        <MapPin size={11} style={{ color: "var(--charcoal-mist)" }} />
        <span
          className="text-[10px]"
          style={{
            color: "var(--charcoal-mist)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Dates may vary based on your location
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReturnPolicy — inline policy snippet
// ─────────────────────────────────────────────────────────────────────────────

function ReturnPolicy() {
  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xl"
      style={{
        background: "rgba(27,94,168,0.05)",
        border: "1px solid rgba(27,94,168,0.15)",
      }}
    >
      <RotateCcw
        size={14}
        style={{ color: "var(--info)", flexShrink: 0, marginTop: 1 }}
      />
      <div>
        <p
          className="text-xs font-bold"
          style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
        >
          30-Day Free Returns
        </p>
        <p
          className="text-[10px] mt-0.5 leading-relaxed"
          style={{
            color: "var(--charcoal-soft)",
            fontFamily: "var(--font-body)",
          }}
        >
          Unused items in original packaging can be returned within 30 days at
          no cost.{" "}
          <a
            href="/returns"
            className="underline font-semibold"
            style={{ color: "var(--info)" }}
          >
            View policy
          </a>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StickyAddToCart — mobile bar visible when primary CTA scrolls out of view
// ─────────────────────────────────────────────────────────────────────────────

interface StickyProps {
  productTitle: string;
  price: number;
  inStock: boolean;
  onAddToCart: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}

function StickyAddToCart({
  productTitle,
  price,
  inStock,
  onAddToCart,
  visible,
}: Omit<StickyProps, "sentinelRef">) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(110%)",
        background: "var(--charcoal)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs text-white/60 truncate"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {productTitle}
          </p>
          <p
            className="text-base font-black text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${price.toFixed(2)}
          </p>
        </div>
        <Button
          onClick={onAddToCart}
          disabled={!inStock}
          className="h-11 px-6 rounded-xl font-bold text-sm shrink-0"
          style={{
            background: inStock ? "var(--red)" : "rgba(255,255,255,0.15)",
            color: "white",
            fontFamily: "var(--font-body)",
          }}
        >
          <ShoppingCart size={15} className="mr-2" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShippingSection
// ─────────────────────────────────────────────────────────────────────────────

function ShippingSection({ shipping }: { shipping: ProductData["shipping"] }) {
  return (
    <div
      className="space-y-3 p-4 rounded-xl"
      style={{
        background: "white",
        border: "1px solid rgba(30,30,30,0.1)",
        boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
      }}
    >
      <div
        className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
        style={{
          color: "var(--charcoal-mist)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <Truck size={13} style={{ color: "var(--red)" }} />
        Shipping
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-1.5 rounded-md"
            style={{ background: "rgba(13,122,78,0.07)" }}
          >
            <Package size={14} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <p
              className="text-xs font-bold"
              style={{ color: "var(--charcoal)" }}
            >
              {shipping.freeShipping
                ? "Free Standard Shipping"
                : "Standard Shipping"}
            </p>
            <p
              className="text-[10px]"
              style={{
                color: "var(--charcoal-mist)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {shipping.estimatedDelivery || "3–5 business days"}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold"
          style={{
            color: shipping.freeShipping ? "var(--success)" : "var(--charcoal)",
          }}
        >
          {shipping.freeShipping
            ? "FREE"
            : `$${shipping.shippingCost.toFixed(2)}`}
        </span>
      </div>

      {shipping.expressAvailable && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-1.5 rounded-md"
              style={{ background: "rgba(200,16,46,0.07)" }}
            >
              <Zap size={14} style={{ color: "var(--red)" }} />
            </div>
            <div>
              <p
                className="text-xs font-bold"
                style={{ color: "var(--charcoal)" }}
              >
                Express Shipping
              </p>
              <p
                className="text-[10px]"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {shipping.expressDelivery || "1–2 business days"}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--charcoal)" }}
          >
            ${shipping.expressCost.toFixed(2)}
          </span>
        </div>
      )}

      {!shipping.freeShipping && (
        <div
          className="flex items-center gap-2 pt-2"
          style={{ borderTop: "1px dashed rgba(30,30,30,0.1)" }}
        >
          <CheckCircle2 size={11} style={{ color: "var(--success)" }} />
          <span
            className="text-[10px]"
            style={{ color: "var(--charcoal-soft)" }}
          >
            Add items worth{" "}
            <strong style={{ color: "var(--success)" }}>$500</strong> for free
            shipping
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrustBadges
// ─────────────────────────────────────────────────────────────────────────────

function TrustBadges() {
  const badges = [
    {
      icon: Lock,
      color: "var(--success)",
      bg: "rgba(13,122,78,0.07)",
      border: "rgba(13,122,78,0.18)",
      label: "Secure Payment",
      sub: "256-bit SSL",
    },
    {
      icon: RotateCcw,
      color: "var(--info)",
      bg: "rgba(27,94,168,0.07)",
      border: "rgba(27,94,168,0.18)",
      label: "Easy Returns",
      sub: "30-day policy",
    },
    {
      icon: CheckCircle2,
      color: "var(--red)",
      bg: "rgba(200,16,46,0.07)",
      border: "rgba(200,16,46,0.18)",
      label: "Genuine Product",
      sub: "100% authentic",
    },
    {
      icon: Clock,
      color: "var(--warning)",
      bg: "rgba(180,83,9,0.07)",
      border: "rgba(180,83,9,0.18)",
      label: "24/7 Support",
      sub: "Always available",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2">
      {badges.map(({ icon: Icon, color, bg, border, label, sub }) => (
        <div
          key={label}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <Icon size={15} style={{ color, flexShrink: 0 }} />
          <div>
            <p
              className="text-[11px] font-bold"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            >
              {label}
            </p>
            <p
              className="text-[9px] uppercase tracking-wide"
              style={{
                color: "var(--charcoal-mist)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RatingBar
// ─────────────────────────────────────────────────────────────────────────────

function RatingBar({
  rating,
  reviewCount,
  ratingDistribution,
}: {
  rating: number;
  reviewCount: number;
  ratingDistribution: Record<number, number>;
}) {
  if (reviewCount === 0) return null;
  return (
    <div
      className="p-4 space-y-3 rounded-xl"
      style={{
        background: "white",
        border: "1px solid rgba(30,30,30,0.1)",
        boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
      }}
    >
      <div
        className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
        style={{
          color: "var(--charcoal-mist)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <Star size={13} style={{ color: "var(--red)" }} />
        Customer Ratings
      </div>

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <span
            className="text-4xl font-black"
            style={{
              color: "var(--charcoal)",
              fontFamily: "var(--font-display)",
            }}
          >
            {rating.toFixed(1)}
          </span>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < Math.round(rating) ? "var(--red)" : "none"}
                color={
                  i < Math.round(rating) ? "var(--red)" : "rgba(30,30,30,0.15)"
                }
              />
            ))}
          </div>
          <p
            className="text-[9px] mt-1 uppercase tracking-wider"
            style={{
              color: "var(--charcoal-mist)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] ?? 0;
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span
                  className="text-[9px] w-3 shrink-0 text-right"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {star}
                </span>
                <Star
                  size={8}
                  fill="var(--red)"
                  color="var(--red)"
                  className="shrink-0"
                />
                <div
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 4, background: "var(--off-white-2)" }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "var(--red)",
                      borderRadius: 9999,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <span
                  className="text-[9px] w-5 shrink-0"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompareButton
// ─────────────────────────────────────────────────────────────────────────────

const COMPARE_KEY = "bazr_compare";

function useCompare(productId: string) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem(COMPARE_KEY) ?? "[]",
      );
      setInCompare(ids.includes(productId));
    } catch {}
  }, [productId]);

  const toggle = (title: string) => {
    try {
      let ids: string[] = JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]");
      if (ids.includes(productId)) {
        ids = ids.filter((id) => id !== productId);
        setInCompare(false);
        toast.success(`"${title}" removed from compare list`);
      } else {
        if (ids.length >= 4) {
          toast.error("You can compare up to 4 products.");
          return;
        }
        ids = [...ids, productId];
        setInCompare(true);
        toast.success(`Added to compare`, {
          action: {
            label: "Compare Now",
            onClick: () => (window.location.href = "/compare"),
          },
        });
      }
      localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
    } catch {}
  };

  return { inCompare, toggle };
}

function CompareButton({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const { inCompare, toggle } = useCompare(productId);
  return (
    <button
      onClick={() => toggle(productTitle)}
      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
      style={{
        color: inCompare ? "var(--info)" : "var(--charcoal-mist)",
        fontFamily: "var(--font-body)",
      }}
      aria-label="Add to compare"
    >
      <GitCompare size={13} />
      {inCompare ? "Remove from Compare" : "Add to Compare"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChannelBadges
// ─────────────────────────────────────────────────────────────────────────────

function ChannelBadges({
  publishToMarket,
  publishToStore,
  isApproved,
}: {
  publishToMarket: boolean;
  publishToStore: boolean;
  isApproved: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {publishToMarket && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border"
          style={{
            background: "rgba(200,16,46,0.07)",
            borderColor: "rgba(200,16,46,0.18)",
            color: "var(--red)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <Globe size={9} /> Marketplace
        </span>
      )}
      {publishToStore && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border"
          style={{
            background: "rgba(27,94,168,0.07)",
            borderColor: "rgba(27,94,168,0.18)",
            color: "var(--info)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <Store size={9} /> E-Store
        </span>
      )}
      {isApproved && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border"
          style={{
            background: "rgba(13,122,78,0.07)",
            borderColor: "rgba(13,122,78,0.18)",
            color: "var(--success)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <BadgeCheck size={9} /> Verified
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TagChips
// ─────────────────────────────────────────────────────────────────────────────

function TagChips({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag size={11} style={{ color: "var(--charcoal-mist)", flexShrink: 0 }} />
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border"
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--off-white-2)",
            borderColor: "rgba(30,30,30,0.1)",
            color: "var(--charcoal-soft)",
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams() as { id?: string };
  const productId = params.id ?? "";

  const { user } = useAuth();
  const { isInWishlist, toggle: toggleWishlist } = useHybridWishlist();
  const { addItem } = useCart();

  const { data: rawProduct, isLoading: loading } = useProduct(productId);
  const { data: apiVariants = [] } = useProductVariants(productId);

  // Sentinel ref for sticky add-to-cart bar
  const ctaSentinelRef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const el = ctaSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const product = useMemo<ProductData | null>(() => {
    if (!rawProduct) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (rawProduct as any)?.data ?? (rawProduct as any);
    if (!r?.id) return null;

    return {
      id: r.id ?? productId,
      title: r.name ?? r.title ?? "",
      description: r.description ?? "",
      price: r.price ?? 0,
      oldPrice: r.oldPrice ?? null,
      discountPercentage: r.discountPercentage ?? 0,
      hasDiscount: r.hasDiscount ?? false,
      discountAmount: r.discountAmount ?? 0,
      mainImage: r.images?.[0] ?? r.mainImage ?? "",
      images:
        Array.isArray(r.images) && r.images.length > 0
          ? r.images
          : ["/placeholder.png"],
      videoUrl: r.videoUrl ?? null,
      category: {
        id: r.category?.id ?? 0,
        name: r.category?.name ?? r.categoryName ?? "",
        slug: r.category?.slug,
      },
      middleCategory: r.middleCategory
        ? {
            id: r.middleCategory.id,
            name: r.middleCategory.name,
            slug: r.middleCategory.slug,
          }
        : null,
      subCategory: r.subCategory
        ? {
            id: r.subCategory.id,
            name: r.subCategory.name,
            slug: r.subCategory.slug,
          }
        : null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      brand: r.merchant?.storeName
        ? {
            id: r.merchant.id?.toString() ?? "",
            name: r.merchant.storeName,
            slug: r.merchant.slug,
            image: r.merchant.logoUrl ?? null,
            customDomain: r.merchant.customDomain ?? null,
            handlingHours: r.merchant.handlingHours ?? 24,
          }
        : null,
      color: r.color ?? null,
      productGroupId: r.productGroupId ?? null,
      otherColors: Array.isArray(r.otherColors) ? r.otherColors : [],
      rating: r.rating ?? 0,
      reviewCount: r.reviewCount ?? 0,
      ratingDistribution: r.ratingDistribution ?? {},
      reviews: Array.isArray(r.reviews)
        ? r.reviews.map((rev: any) => ({
            id: rev.id,
            rating: rev.rating,
            title: rev.title ?? null,
            comment: rev.comment ?? null,
            createdAt: rev.createdAt,
            user: rev.user ?? {
              name: rev.customerName ?? "Anonymous",
              surname: "",
            },
          }))
        : [],
      stock: {
        inStock: (r.stock ?? 0) > 0,
        quantity: r.stock ?? 0,
        lowStock: (r.stock ?? 0) > 0 && (r.stock ?? 0) < 10,
      },
      publishToMarket: r.publishToMarket ?? false,
      publishToStore: r.publishToStore ?? false,
      isApproved: r.isApproved ?? false,
      shipping: {
        freeShipping: r.shipping?.freeShipping ?? false,
        estimatedDelivery: r.shipping?.estimatedDelivery ?? "",
        shippingCost: r.shipping?.shippingCost ?? 0,
        expressAvailable: r.shipping?.expressAvailable ?? false,
        expressDelivery: r.shipping?.expressDelivery ?? "",
        expressCost: r.shipping?.expressCost ?? 0,
      },
      specifications: {
        weight: r.specifications?.weight ?? null,
        dimensions: r.specifications?.dimensions ?? null,
        material: r.specifications?.material ?? null,
        warranty: r.specifications?.warranty ?? "—",
        origin: r.specifications?.origin ?? "—",
        certifications: r.specifications?.certifications ?? [],
      },
      relatedProducts: Array.isArray(r.relatedProducts)
        ? r.relatedProducts
        : [],
      brandProducts: Array.isArray(r.brandProducts) ? r.brandProducts : [],
      meta: {
        views: r.meta?.views ?? 0,
        favorites: r.meta?.favorites ?? 0,
        purchaseCount: r.meta?.purchaseCount ?? 0,
        lastUpdated: r.meta?.lastUpdated ?? r.updatedAt ?? r.createdAt ?? "",
      },
      availableSizes: Array.isArray(r.availableSizes) ? r.availableSizes : [],
      stockMatrix:
        Array.isArray(r.stockMatrix) && r.stockMatrix.length > 0
          ? r.stockMatrix
          : (r.stock ?? 0) > 0
            ? [{ id: 0, sizeId: null, stock: r.stock, priceModifier: 0 }]
            : [],
      bulkDiscountQty: r.bulkDiscountQty ?? null,
      bulkDiscountRate: r.bulkDiscountRate ?? null,
    };
  }, [rawProduct, productId]);

  const favorited = isInWishlist(productId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (!product) return;
    trackProductView({
      id: product.id,
      name: product.title,
      price: product.price,
      images: product.images,
      merchantStoreName: product.brand?.name,
    });
  }, [product?.id]);

  const selectedStock = useMemo<StockEntry | null>(() => {
    if (!product) return null;
    if (product.availableSizes.length > 0)
      return selectedSizeId
        ? (product.stockMatrix.find((s) => s.sizeId === selectedSizeId) ?? null)
        : null;
    return product.stockMatrix.find((s) => s.sizeId === null) ?? null;
  }, [selectedSizeId, product]);

  const calculateBulkDiscount = useCallback(() => {
    if (!product) return { hasDiscount: false, discountRate: 0 };
    const { bulkDiscountQty, bulkDiscountRate } = product;
    if (
      !bulkDiscountQty ||
      !bulkDiscountRate ||
      bulkDiscountQty <= 0 ||
      bulkDiscountRate <= 0
    )
      return { hasDiscount: false, discountRate: 0 };
    return quantity >= bulkDiscountQty
      ? { hasDiscount: true, discountRate: bulkDiscountRate }
      : { hasDiscount: false, discountRate: 0 };
  }, [product, quantity]);

  const handleAddToCart = useCallback(() => {
    if (!product) {
      toast.error("Product information not found.");
      return;
    }

    // Variant system: require selection if JSONB variants exist
    if (apiVariants.length > 0 && !selectedVariant) {
      toast.error("Please select your variant options.");
      return;
    }
    if (selectedVariant && selectedVariant.stock <= 0) {
      toast.error("The selected variant is out of stock.");
      return;
    }
    // Legacy size system fallback
    if (
      product.availableSizes.length > 0 &&
      !selectedSizeId &&
      apiVariants.length === 0
    ) {
      toast.error("Please select a size.");
      return;
    }
    if (selectedStock && selectedStock.stock <= 0 && apiVariants.length === 0) {
      toast.error("Selected size is out of stock.");
      return;
    }

    const bulkDiscount = calculateBulkDiscount();
    let basePrice =
      selectedVariant?.priceOverride ??
      product.price + (selectedStock?.priceModifier ?? 0);
    if (bulkDiscount.hasDiscount)
      basePrice = basePrice * (1 - bulkDiscount.discountRate / 100);

    const offerId = selectedVariant
      ? `${product.id}_variant_${selectedVariant.id}`
      : selectedSizeId
        ? `${product.id}_size_${selectedSizeId}`
        : product.id;

    for (let i = 0; i < quantity; i++) {
      addItem({
        offerId,
        productId: product.id,
        productName: product.title,
        productImage: selectedVariant?.imageUrl ?? product.mainImage,
        price: basePrice,
        merchantId: product.brand?.id ?? "marketplace",
        merchantStoreName: product.brand?.name,
        merchantSlug: product.brand?.slug,
        stock:
          selectedVariant?.stock ??
          selectedStock?.stock ??
          product.stock.quantity,
        source: "MARKETPLACE",
      });
    }

    const msg = bulkDiscount.hasDiscount
      ? `${quantity} item(s) added! ${bulkDiscount.discountRate}% bulk discount applied!`
      : `${quantity} item(s) added to cart!`;

    toast.success(msg, {
      description: !user ? "Cart saved to your account on sign in." : undefined,
      duration: !user ? 4000 : 2000,
    });
  }, [
    product,
    selectedVariant,
    selectedSizeId,
    selectedStock,
    quantity,
    calculateBulkDiscount,
    addItem,
    user,
    apiVariants.length,
  ]);

  const handleToggleFavorite = async () => {
    if (!product || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const added = await toggleWishlist(productId, {
        productName: product.title,
        productImage: product.mainImage,
        price: product.price,
      });
      toast.success(
        added
          ? `"${product.title}" added to wishlist`
          : `"${product.title}" removed from wishlist`,
        {
          description:
            !user && added ? "Sign in to save your list." : undefined,
          duration: added && !user ? 4000 : 2000,
        },
      );
    } catch {
      toast.error("An error occurred, please try again.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return <ProductDetailSkeleton />;

  if (!product)
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "var(--off-white)" }}
      >
        <div className="text-center space-y-3">
          <Package
            size={48}
            className="mx-auto opacity-20"
            style={{ color: "var(--charcoal)" }}
          />
          <p
            className="text-xl font-bold"
            style={{
              color: "var(--charcoal)",
              fontFamily: "var(--font-display)",
            }}
          >
            Product not found
          </p>
          <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
            This product may have been removed or is no longer available.
          </p>
        </div>
      </div>
    );

  const bulkDiscount = calculateBulkDiscount();
  const activePrice =
    selectedVariant?.priceOverride ??
    product.price + (selectedStock?.priceModifier ?? 0);
  const currentPrice = bulkDiscount.hasDiscount
    ? activePrice * (1 - bulkDiscount.discountRate / 100)
    : activePrice;
  const subtotal = currentPrice * quantity;
  const vatAmount = subtotal * 0.1;
  const totalWithVat = subtotal + vatAmount;
  const remainingForBulk = product.bulkDiscountQty
    ? Math.max(0, product.bulkDiscountQty - quantity)
    : 0;

  const hasJSONBVariants = apiVariants.length > 0;
  const effectiveStock = selectedVariant
    ? {
        inStock: selectedVariant.stock > 0,
        quantity: selectedVariant.stock,
        lowStock: selectedVariant.stock > 0 && selectedVariant.stock <= 5,
      }
    : product.stock;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        maxWidth: 1300,
        background: "var(--off-white)",
        color: "var(--charcoal)",
        fontFamily: "var(--font-body)",
        margin: "0 auto",
      }}
    >
      {/* Sticky mobile CTA */}
      <StickyAddToCart
        productTitle={product.title}
        price={currentPrice}
        inStock={effectiveStock.inStock}
        onAddToCart={handleAddToCart}
        visible={stickyVisible}
      />

      <div className="w-full pb-24 pt-4 md:pt-8 px-4 md:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-6 flex-wrap">
          {[
            { label: "Home", href: "/" },
            {
              label: product.category.name,
              href: `/category/${product.category.slug}`,
            },
            ...(product.subCategory
              ? [
                  {
                    label: product.subCategory.name,
                    href: `/category/${product.subCategory.slug}`,
                  },
                ]
              : []),
          ].map((crumb, i, arr) => (
            <React.Fragment key={crumb.href}>
              <a
                href={crumb.href}
                className="text-[11px] font-medium hover:underline"
                style={{
                  color:
                    i === arr.length - 1
                      ? "var(--charcoal)"
                      : "var(--charcoal-mist)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {crumb.label}
              </a>
              {i < arr.length - 1 && (
                <ChevronRight
                  size={10}
                  style={{ color: "var(--charcoal-mist)" }}
                />
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Gallery ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 lg:sticky lg:top-20 lg:self-start lg:z-40">
            <ProductImageGallery
              images={
                selectedVariant?.imageUrl
                  ? [selectedVariant.imageUrl, ...product.images]
                  : product.images
              }
              videoUrl={product.videoUrl}
              activeIndex={activeIndex}
              onIndexChange={setActiveIndex}
              hasDiscount={product.hasDiscount}
              discountPercentage={product.discountPercentage}
              productTitle={product.title}
            />

            {/* Rating bar — visible in left column on desktop */}
            <div className="hidden lg:block mt-6">
              <RatingBar
                rating={product.rating}
                reviewCount={product.reviewCount}
                ratingDistribution={product.ratingDistribution}
              />
            </div>
          </div>

          {/* ── Product Panel ────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 flex flex-col pt-2 space-y-6">
            {/* Channel badges + tags */}
            <div className="space-y-2">
              <ChannelBadges
                publishToMarket={product.publishToMarket}
                publishToStore={product.publishToStore}
                isApproved={product.isApproved}
              />
              <TagChips tags={product.tags} />
            </div>

            {/* Core product info */}
            <ProductInfo
              id={product.id}
              title={product.title}
              category={product.category}
              middleCategory={product.middleCategory}
              subCategory={product.subCategory}
              brand={product.brand}
              rating={product.rating}
              reviewCount={product.reviewCount}
              currentPrice={currentPrice}
              oldPrice={product.oldPrice}
              hasDiscount={product.hasDiscount}
              discountPercentage={product.discountPercentage}
              inStock={effectiveStock.inStock}
              lowStock={effectiveStock.lowStock}
              stockQuantity={effectiveStock.quantity}
              hasCustomImage={false}
              selectedStock={selectedStock}
            />

            {/* ── Variant selectors ─────────────────────────────────────────── */}
            {hasJSONBVariants ? (
              <DynamicVariantSelector
                variants={apiVariants}
                basePrice={product.price}
                onVariantChange={setSelectedVariant}
              />
            ) : (
              <ProductVariantSelector
                availableSizes={product.availableSizes}
                stockMatrix={product.stockMatrix}
                selectedSizeId={selectedSizeId}
                selectedStock={selectedStock}
                onSizeChange={setSelectedSizeId}
                productGroupId={product.productGroupId}
                currentProductId={product.id}
                currentColor={product.color}
                currentMainImage={product.mainImage}
                currentTitle={product.title}
                otherColors={product.otherColors}
              />
            )}

            {/* Low-stock urgency */}
            {effectiveStock.lowStock && effectiveStock.quantity > 0 && (
              <div
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                style={{
                  background: "rgba(200,16,46,0.07)",
                  border: "1px solid rgba(200,16,46,0.18)",
                }}
              >
                <AlertTriangle
                  size={13}
                  style={{ color: "var(--red)", flexShrink: 0 }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: "var(--red)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Only {effectiveStock.quantity} left in stock — order soon!
                </span>
              </div>
            )}

            {/* Bulk discount opportunity */}
            {product.bulkDiscountQty !== null &&
              product.bulkDiscountRate !== null &&
              product.bulkDiscountQty > 0 &&
              product.bulkDiscountRate > 0 && (
                <div
                  className="p-4 space-y-2 rounded-xl"
                  style={{
                    border: `1px solid ${bulkDiscount.hasDiscount ? "rgba(13,122,78,0.18)" : "rgba(27,94,168,0.18)"}`,
                    background: bulkDiscount.hasDiscount
                      ? "rgba(13,122,78,0.07)"
                      : "rgba(27,94,168,0.07)",
                  }}
                >
                  <div
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: bulkDiscount.hasDiscount
                        ? "var(--success)"
                        : "var(--info)",
                    }}
                  >
                    <Percent size={13} />
                    {bulkDiscount.hasDiscount
                      ? `🎉 Bulk Discount Applied — ${bulkDiscount.discountRate}% Off!`
                      : "Bulk Pricing Available"}
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: "var(--charcoal-soft)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {bulkDiscount.hasDiscount ? (
                      <>
                        You are saving{" "}
                        <strong>{product.bulkDiscountRate}%</strong> on orders
                        of {product.bulkDiscountQty} or more.
                      </>
                    ) : (
                      <>
                        Buy <strong>{product.bulkDiscountQty} or more</strong>{" "}
                        for a{" "}
                        <strong>{product.bulkDiscountRate}% discount</strong>.
                        {remainingForBulk > 0 && (
                          <>
                            {" "}
                            Add{" "}
                            <strong style={{ color: "var(--info)" }}>
                              {remainingForBulk} more
                            </strong>{" "}
                            to unlock the offer.
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
              )}

            {/* Sentinel for sticky CTA intersection observer */}
            <div ref={ctaSentinelRef} />

            {/* Product actions (quantity, add to cart, wishlist, share) */}
            <ProductActions
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              onShare={handleShare}
              isFavorited={favorited}
              inStock={effectiveStock.inStock}
              sizeStockAvailable={!selectedStock || selectedStock.stock > 0}
            />

            {/* Compare + secondary actions row */}
            <div className="flex items-center justify-between">
              <CompareButton
                productId={product.id}
                productTitle={product.title}
              />
              {product.meta.purchaseCount > 0 && (
                <span
                  className="text-[11px]"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  🛒 {product.meta.purchaseCount.toLocaleString()} sold
                </span>
              )}
            </div>

            <Separator />

            {/* Price summary */}
            <div
              className="p-4 space-y-2.5 rounded-xl"
              style={{
                background: "var(--off-white-2)",
                border: "1px solid rgba(30,30,30,0.1)",
                boxShadow: "0 1px 2px rgba(30,30,30,0.05)",
              }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--charcoal-soft)" }}>
                  Unit Price × {quantity}
                </span>
                <span
                  className="font-bold"
                  style={{ color: "var(--charcoal)" }}
                >
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              {bulkDiscount.hasDiscount && (
                <div
                  className="flex justify-between text-sm -mx-4 px-4 py-1.5"
                  style={{ background: "rgba(13,122,78,0.07)" }}
                >
                  <span
                    className="font-semibold flex items-center gap-1"
                    style={{ color: "var(--success)" }}
                  >
                    <Percent size={13} /> Bulk Discount (
                    {bulkDiscount.discountRate}%)
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: "var(--success)" }}
                  >
                    -$
                    {(
                      activePrice *
                      quantity *
                      (bulkDiscount.discountRate / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--charcoal-soft)" }}>VAT (10%)</span>
                <span
                  className="font-bold"
                  style={{ color: "var(--charcoal)" }}
                >
                  ${vatAmount.toFixed(2)}
                </span>
              </div>
              <div
                className="pt-2 flex justify-between"
                style={{ borderTop: "1px solid rgba(30,30,30,0.18)" }}
              >
                <span
                  className="text-base font-bold"
                  style={{ color: "var(--charcoal)" }}
                >
                  Total (incl. VAT)
                </span>
                <span
                  className="text-lg font-black"
                  style={{
                    color: "var(--red)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ${totalWithVat.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Delivery estimate (dynamic) */}
            <DeliveryEstimate handlingHours={product.brand?.handlingHours} />

            {/* Shipping costs */}
            <ShippingSection shipping={product.shipping} />

            {/* Return policy */}
            <ReturnPolicy />

            {/* Trust badges */}
            <TrustBadges />

            {/* Rating — mobile (in right column) */}
            <div className="lg:hidden">
              <RatingBar
                rating={product.rating}
                reviewCount={product.reviewCount}
                ratingDistribution={product.ratingDistribution}
              />
            </div>

            {/* Specifications */}
            <div
              className="space-y-4 pt-2"
              style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
            >
              <div
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                <Info size={13} style={{ color: "var(--red)" }} /> Product
                Specifications
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: Award,
                    bg: "rgba(27,94,168,0.07)",
                    border: "rgba(27,94,168,0.18)",
                    color: "var(--info)",
                    label: "Warranty",
                    value: product.specifications.warranty,
                  },
                  {
                    icon: BadgeCheck,
                    bg: "rgba(13,122,78,0.07)",
                    border: "rgba(13,122,78,0.18)",
                    color: "var(--success)",
                    label: "Origin",
                    value: product.specifications.origin,
                  },
                  {
                    icon: ShieldCheck,
                    bg: "rgba(180,83,9,0.07)",
                    border: "rgba(180,83,9,0.18)",
                    color: "var(--warning)",
                    label: "Certifications",
                    value:
                      product.specifications.certifications.join(", ") || "—",
                  },
                  {
                    icon: HardHat,
                    bg: "rgba(200,16,46,0.07)",
                    border: "rgba(200,16,46,0.18)",
                    color: "var(--red)",
                    label: "HSE Compliance",
                    value: "Approved",
                  },
                ].map(({ icon: Icon, bg, border, color, label, value }) => (
                  <div
                    key={label}
                    className="p-3 flex items-center gap-3 rounded-lg"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <Icon size={15} style={{ color, flexShrink: 0 }} />
                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{
                          color: "var(--charcoal)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{
                          color: "var(--charcoal-mist)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {product.description && (
                <div
                  className="prose max-w-none text-[13px] leading-relaxed"
                  style={{ color: "var(--charcoal-soft)" }}
                  /* Only render description as HTML — content originates from merchant input,
                     sanitize server-side with HtmlSanitizer before storing in DB */
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Meta stats bar ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            {
              icon: Eye,
              color: "var(--red)",
              value: product.meta.views,
              label: "Views",
            },
            {
              icon: Heart,
              color: "var(--red)",
              value: product.meta.favorites,
              label: "Wishlisted",
            },
            {
              icon: ShoppingCart,
              color: "var(--success)",
              value: product.meta.purchaseCount,
              label: "Sold",
            },
          ].map(({ icon: Icon, color, value, label }) => (
            <div
              key={label}
              className="p-4 text-center rounded-xl"
              style={{
                background: "white",
                border: "1px solid rgba(30,30,30,0.1)",
                boxShadow: "0 1px 4px rgba(30,30,30,0.05)",
              }}
            >
              <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
              <p
                className="text-lg font-bold"
                style={{
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {value.toLocaleString()}
              </p>
              <p
                className="text-[9px] uppercase tracking-wider"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Other sellers / BuyBox ──────────────────────────────────────────── */}
        <OtherSellers
          productId={product.id}
          productName={product.title}
          productImage={product.mainImage}
          currentMerchantSlug={product.brand?.slug}
        />

        {/* ── Related products ────────────────────────────────────────────────── */}
        {product.relatedProducts.length > 0 && (
          <ProductCarousel
            products={product.relatedProducts}
            title="Related Products"
            icon={<TrendingUp size={18} style={{ color: "var(--red)" }} />}
          />
        )}

        {/* ── More from this store ─────────────────────────────────────────────── */}
        {product.brand && product.brandProducts.length > 0 && (
          <ProductCarousel
            products={product.brandProducts}
            title={`More from ${product.brand.name}`}
            icon={<Users size={18} style={{ color: "var(--red)" }} />}
          />
        )}

        {/* ── Tabs (Description / Reviews / Q&A) ──────────────────────────────── */}
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
        >
          <ProductTabs
            productId={product.id}
            productTitle={product.title}
            productPrice={product.price}
            productDescription={product.description}
          />
        </div>

        {/* ── Recently viewed ──────────────────────────────────────────────────── */}
        <RecentlyViewedSection currentProductId={product.id} />
      </div>
    </div>
  );
}
