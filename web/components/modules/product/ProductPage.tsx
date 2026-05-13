"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";

import { RecentlyViewedSection } from "@/components/modules/home/RecentlyViewed";
import { toast } from "sonner";
import ProductTabs from "@/components/modules/product/productDetail/ProductTabs";
import ProductDetailSkeleton from "@/components/modules/product/productDetail/ProductDetailSkeleton";
import ProductImageGallery from "@/components/modules/product/productDetail/ProductImageGallery";
import ProductInfo from "@/components/modules/product/productDetail/ProductInfo";
import ProductVariantSelector from "@/components/modules/product/productDetail/ProductVariantSelector";
import ProductActions from "@/components/modules/product/productDetail/ProductActions";
import ProductCarousel from "@/components/modules/product/productDetail/ProductCarousel";
import { useHybridWishlist } from "@/hooks/use-hybrid-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

// ── Types ─────────────────────────────────────────────────────────────────────

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
    id: number;
    name: string;
    slug?: string;
    image: string | null;
    customDomain?: string | null;
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
  ratingDistribution: { [key: number]: number };
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

// ── Shipping Info Section ─────────────────────────────────────────────────────

function ShippingSection({ shipping }: { shipping: ProductData["shipping"] }) {
  return (
    <div
      className="space-y-3 p-4"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(30,30,30,0.1)",
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
      }}
    >
      <div
        className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
        style={{ color: "#9a9a9a", fontFamily: "'JetBrains Mono', monospace" }}
      >
        <Truck size={13} style={{ color: "#c8102e" }} />
        Delivery &amp; Shipping
      </div>

      {/* Standard Shipping */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-md"
            style={{ background: "rgba(13,122,78,0.07)" }}
          >
            <Package size={15} style={{ color: "#0d7a4e" }} />
          </div>
          <div>
            <div className="text-xs font-bold" style={{ color: "#1e1e1e" }}>
              {shipping.freeShipping
                ? "Free Standard Shipping"
                : "Standard Shipping"}
            </div>
            <div
              className="text-[10px]"
              style={{
                color: "#9a9a9a",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {shipping.estimatedDelivery}
            </div>
          </div>
        </div>
        <span
          className="text-xs font-bold"
          style={{ color: shipping.freeShipping ? "#0d7a4e" : "#1e1e1e" }}
        >
          {shipping.freeShipping
            ? "FREE"
            : `${shipping.shippingCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`}
        </span>
      </div>

      {/* Express Shipping */}
      {shipping.expressAvailable && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-md"
              style={{ background: "rgba(200,16,46,0.07)" }}
            >
              <Zap size={15} style={{ color: "#c8102e" }} />
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: "#1e1e1e" }}>
                Express Shipping
              </div>
              <div
                className="text-[10px]"
                style={{
                  color: "#9a9a9a",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {shipping.expressDelivery}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold" style={{ color: "#1e1e1e" }}>
            {shipping.expressCost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}{" "}
            USD
          </span>
        </div>
      )}

      {/* Free shipping threshold notice */}
      {!shipping.freeShipping && (
        <div
          className="flex items-center gap-2 pt-2"
          style={{ borderTop: "1px dashed rgba(30,30,30,0.1)" }}
        >
          <CheckCircle2 size={12} style={{ color: "#0d7a4e" }} />
          <span className="text-[10px]" style={{ color: "#747474" }}>
            Add more to get{" "}
            <strong style={{ color: "#0d7a4e" }}>FREE shipping</strong> on
            orders over 500 USD
          </span>
        </div>
      )}
    </div>
  );
}

// ── Trust Badges ──────────────────────────────────────────────────────────────

function TrustBadges() {
  const badges = [
    {
      icon: <Lock size={16} />,
      color: "#0d7a4e",
      bg: "rgba(13,122,78,0.07)",
      border: "rgba(13,122,78,0.18)",
      label: "Secure Payment",
      sub: "256-bit SSL",
    },
    {
      icon: <RotateCcw size={16} />,
      color: "#1b5ea8",
      bg: "rgba(27,94,168,0.07)",
      border: "rgba(27,94,168,0.18)",
      label: "Easy Returns",
      sub: "30-day policy",
    },
    {
      icon: <CheckCircle2 size={16} />,
      color: "#c8102e",
      bg: "rgba(200,16,46,0.07)",
      border: "rgba(200,16,46,0.18)",
      label: "Genuine Product",
      sub: "100% authentic",
    },
    {
      icon: <Clock size={16} />,
      color: "#b45309",
      bg: "rgba(180,83,9,0.07)",
      border: "rgba(180,83,9,0.18)",
      label: "24/7 Support",
      sub: "Always available",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {badges.map(({ icon, color, bg, border, label, sub }) => (
        <div
          key={label}
          className="flex items-center gap-3 p-3"
          style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: "10px",
          }}
        >
          <div style={{ color }}>{icon}</div>
          <div>
            <div className="text-[11px] font-bold" style={{ color: "#1e1e1e" }}>
              {label}
            </div>
            <div
              className="text-[9px] uppercase tracking-wide"
              style={{
                color: "#9a9a9a",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Rating Distribution Bar ───────────────────────────────────────────────────

function RatingBar({
  rating,
  reviewCount,
  ratingDistribution,
}: {
  rating: number;
  reviewCount: number;
  ratingDistribution: { [key: number]: number };
}) {
  if (reviewCount === 0) return null;
  return (
    <div
      className="p-4 space-y-3"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(30,30,30,0.1)",
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
      }}
    >
      <div className="flex items-center gap-4">
        <div>
          <span
            className="text-4xl font-black"
            style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
          >
            {rating.toFixed(1)}
          </span>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < Math.round(rating) ? "#c8102e" : "none"}
                color={i < Math.round(rating) ? "#c8102e" : "#e6e4e1"}
              />
            ))}
          </div>
          <div
            className="text-[9px] mt-1 uppercase tracking-wider"
            style={{
              color: "#9a9a9a",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] ?? 0;
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span
                  className="text-[9px] w-4 text-right shrink-0"
                  style={{
                    color: "#9a9a9a",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {star}
                </span>
                <Star
                  size={8}
                  fill="#c8102e"
                  color="#c8102e"
                  className="shrink-0"
                />
                <div
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 4, background: "#efeeec" }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#c8102e",
                      borderRadius: 9999,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <span
                  className="text-[9px] w-5 shrink-0"
                  style={{
                    color: "#9a9a9a",
                    fontFamily: "'JetBrains Mono', monospace",
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

// ── Compare Hook ──────────────────────────────────────────────────────────────

const COMPARE_KEY = "bazr_compare";

function useCompare(productId: string) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setInCompare(ids.includes(productId));
    } catch {}
  }, [productId]);

  const toggleCompare = (productTitle: string) => {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      let ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.includes(productId)) {
        ids = ids.filter((id) => id !== productId);
        setInCompare(false);
        toast.success(`"${productTitle}" removed from compare list`);
      } else {
        if (ids.length >= 4) {
          toast.error("You can compare up to 4 products at a time.");
          return;
        }
        ids = [...ids, productId];
        setInCompare(true);
        toast.success(`"${productTitle}" added to compare list`, {
          action: {
            label: "Compare Now",
            onClick: () => (window.location.href = "/compare"),
          },
        });
      }
      localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
    } catch {}
  };

  return { inCompare, toggleCompare };
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

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

/**
 * ProductData — aligned with the Product entity in the system architecture.
 * Domain/Entities/Product.cs:
 *   Id, MerchantId, Name, Description, CategoryId, Images, Tags,
 *   Price, Stock, PublishToMarket, PublishToStore, IsApproved, IsDeleted
 *
 * MerchantProfile (for brand info):
 *   StoreName, Slug, LogoUrl, CustomDomain
 *
 * Category (self-ref hierarchy):
 *   Id, Name, Slug, ParentId → subcategory chain
 */
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
  // Category hierarchy — corresponds to self-ref Category table in architecture
  category: { id: number; name: string; slug?: string };
  middleCategory: { id: number; name: string; slug?: string } | null;
  subCategory: { id: number; name: string; slug?: string } | null;
  // Tags — Product.Tags List<string>
  tags: string[];
  // Brand → MerchantProfile (StoreName, Slug, LogoUrl, CustomDomain)
  brand: {
    id: number;
    name: string; // StoreName
    slug?: string; // Merchant slug → /store/{slug}
    image: string | null; // LogoUrl
    customDomain?: string | null; // MerchantProfile.CustomDomain
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
  ratingDistribution: { [key: number]: number };
  reviews: Array<{
    id: number;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: string;
    user: { name: string; surname: string };
  }>;
  stock: { inStock: boolean; quantity: number; lowStock: boolean };
  // Publish channels — PublishToMarket / PublishToStore fields in architecture
  publishToMarket: boolean;
  publishToStore: boolean;
  // IsApproved — admin approval
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

// ── Channel Badges ────────────────────────────────────────────────────────────
// PublishToMarket / PublishToStore / IsApproved visibility indicator

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
            color: "#c8102e",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <Globe size={9} />
          Marketplace
        </span>
      )}
      {publishToStore && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border"
          style={{
            background: "rgba(27,94,168,0.07)",
            borderColor: "rgba(27,94,168,0.18)",
            color: "#1b5ea8",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <Store size={9} />
          E-Store
        </span>
      )}
      {isApproved && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border"
          style={{
            background: "rgba(13,122,78,0.07)",
            borderColor: "rgba(13,122,78,0.18)",
            color: "#0d7a4e",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <BadgeCheck size={9} />
          Approved
        </span>
      )}
    </div>
  );
}

// ── Tag Chips ─────────────────────────────────────────────────────────────────
// Renders the Product.Tags List<string> field

function TagChips({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag size={11} className="text-slate-400 shrink-0" />
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "#efeeec",
            borderColor: "rgba(30,30,30,0.1)",
            color: "#525252",
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams() as { id?: string };
  const productId = params.id ?? "";

  const { user } = useAuth();
  const { isInWishlist, toggle: toggleWishlist } = useHybridWishlist();
  const { addItem } = useCart();

  // useProduct hook — connects to GET /api/products/{id} endpoint
  const { data: rawProduct, isLoading: loading } = useProduct(productId);

  /**
   * Backend response mapping:
   * GET /api/products/{id} → { data: { id, name, description, price, stock,
   *   images[], tags[], category, merchant, publishToMarket, publishToStore,
   *   isApproved, ... } }
   *
   * Price and stock come directly from the Product table (no Offer structure).
   * MerchantProfile: storeName, slug, logoUrl, customDomain
   * Category: self-ref hierarchy (main → middle → sub)
   */
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
            id: r.merchant.id ?? 0,
            name: r.merchant.storeName,
            slug: r.merchant.slug,
            image: r.merchant.logoUrl ?? null,
            customDomain: r.merchant.customDomain ?? null,
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

  // ── Stock Matrix ────────────────────────────────────────────────────────────

  const selectedStock = useMemo<StockEntry | null>(() => {
    if (!product) return null;
    if (product.availableSizes.length > 0) {
      return selectedSizeId
        ? (product.stockMatrix.find((s) => s.sizeId === selectedSizeId) ?? null)
        : null;
    }
    return product.stockMatrix.find((s) => s.sizeId === null) ?? null;
  }, [selectedSizeId, product]);

  // ── Bulk Discount ───────────────────────────────────────────────────────────

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

  // ── Add to Cart ─────────────────────────────────────────────────────────────
  /**
   * Integrated with Zustand useCart (use-cart.ts).
   * In the single-merchant scenario, offerId = productId.
   * No guest / logged-in user distinction — Zustand persists to localStorage.
   * mergeWith() after login should be called in the auth hook.
   */
  const handleAddToCart = () => {
    if (!product) {
      toast.error("Product information not found.");
      return;
    }
    if (product.availableSizes.length > 0 && !selectedSizeId) {
      toast.error("Please select a size.");
      return;
    }
    if (selectedStock && selectedStock.stock <= 0) {
      toast.error("Selected size is out of stock.");
      return;
    }

    const bulkDiscount = calculateBulkDiscount();
    let basePrice = product.price + (selectedStock?.priceModifier ?? 0);
    if (bulkDiscount.hasDiscount)
      basePrice = basePrice * (1 - bulkDiscount.discountRate / 100);

    // In the single-merchant scenario offerId = productId (no Offer structure)
    // If sizeId exists, create offerId as productId_sizeId (variant distinction)
    const offerId = selectedSizeId
      ? `${product.id}_size_${selectedSizeId}`
      : product.id;

    // Call addItem quantity times (each call adds +1)
    for (let i = 0; i < quantity; i++) {
      addItem({
        offerId,
        productId: product.id,
        productName: product.title,
        productImage: product.mainImage,
        price: basePrice,
        merchantId: product.brand?.id?.toString() ?? "marketplace",
        merchantStoreName: product.brand?.name,
        merchantSlug: product.brand?.slug,
        stock: selectedStock?.stock ?? product.stock.quantity,
        source: "MARKETPLACE",
      });
    }

    const successMsg = bulkDiscount.hasDiscount
      ? `${quantity} item(s) added to cart! 🎉 ${bulkDiscount.discountRate}% bulk discount applied!`
      : `${quantity} item(s) added to cart!`;

    toast.success(successMsg, {
      description: !user
        ? "Your cart will be saved to your account when you sign in."
        : undefined,
      duration: !user ? 4000 : 2000,
    });
  };

  // ── Toggle Wishlist ──────────────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (!product) return;
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const added = await toggleWishlist(productId, {
        productName: product.title,
        productImage: product.mainImage,
        price: product.price,
      });

      if (added) {
        toast.success(`"${product.title}" added to wishlist`, {
          description: !user
            ? "Your list will be saved to your account when you sign in."
            : undefined,
          duration: !user ? 4000 : 2000,
        });
      } else {
        toast.success(`"${product.title}" removed from wishlist`, {
          duration: 2000,
        });
      }
    } catch {
      toast.error("An error occurred, please try again.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ── Share ────────────────────────────────────────────────────────────────────

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
      toast.success("Link copied!");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <ProductDetailSkeleton />;
  if (!product)
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "#fafafa" }}
      >
        <div className="text-center space-y-4">
          <p
            className="text-2xl font-bold"
            style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
          >
            Product not found.
          </p>
          <p className="text-sm" style={{ color: "#9a9a9a" }}>
            This product may have been removed or is no longer available.
          </p>
        </div>
      </div>
    );

  const bulkDiscount = calculateBulkDiscount();
  let currentPrice = product.price + (selectedStock?.priceModifier ?? 0);
  if (bulkDiscount.hasDiscount)
    currentPrice = currentPrice * (1 - bulkDiscount.discountRate / 100);
  const subtotal = currentPrice * quantity;
  const vatAmount = subtotal * 0.1;
  const totalWithVat = subtotal + vatAmount;
  const remainingForBulk = product.bulkDiscountQty
    ? Math.max(0, product.bulkDiscountQty - quantity)
    : 0;

  return (
    /*
     * Design system: style_design.html v2.0
     * Colors  : --red #c8102e | --charcoal #1e1e1e | --off-white #fafafa
     * Fonts   : Manrope (body) | Cormorant Garamond (display) | JetBrains Mono (mono)
     * Shadows : shadow-sm / shadow-md / shadow-red
     * Radius  : radius-md 8px | radius-lg 14px
     * Motion  : dur-fast 140ms | ease-out cubic-bezier(0.16,1,0.3,1)
     */
    <div
      className="min-h-screen w-full"
      style={{
        maxWidth: 1300,
        background: "#fafafa",
        color: "#1e1e1e",
        fontFamily: "'Manrope', sans-serif",
        margin: "0 auto",
      }}
    >
      <div className="w-full pb-20 pt-4 md:pt-8 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Gallery ── */}
          <div className="lg:col-span-6 lg:sticky lg:top-20 lg:self-start lg:z-40">
            <ProductImageGallery
              images={product.images}
              videoUrl={product.videoUrl}
              activeIndex={activeIndex}
              onIndexChange={setActiveIndex}
              hasDiscount={product.hasDiscount}
              discountPercentage={product.discountPercentage}
              productTitle={product.title}
            />
          </div>

          {/* ── Product Info ── */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <div className="space-y-8">
              {/* Channel badges (PublishToMarket, PublishToStore, IsApproved) + Tags */}
              <div className="space-y-3">
                <ChannelBadges
                  publishToMarket={product.publishToMarket}
                  publishToStore={product.publishToStore}
                  isApproved={product.isApproved}
                />
                <TagChips tags={product.tags} />
              </div>

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
                inStock={product.stock.inStock}
                lowStock={product.stock.lowStock}
                stockQuantity={product.stock.quantity}
                hasCustomImage={false}
                selectedStock={selectedStock}
              />

              <div className="space-y-6">
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

                {/* Bulk Discount Opportunity */}
                {product.bulkDiscountQty !== null &&
                  product.bulkDiscountRate !== null &&
                  product.bulkDiscountQty > 0 &&
                  product.bulkDiscountRate > 0 && (
                    <div
                      className="p-4 space-y-2"
                      style={{
                        border: `1px solid ${bulkDiscount.hasDiscount ? "rgba(13,122,78,0.18)" : "rgba(27,94,168,0.18)"}`,
                        background: bulkDiscount.hasDiscount
                          ? "rgba(13,122,78,0.07)"
                          : "rgba(27,94,168,0.07)",
                        borderRadius: "14px",
                      }}
                    >
                      <div
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: bulkDiscount.hasDiscount
                            ? "#0d7a4e"
                            : "#1b5ea8",
                        }}
                      >
                        <Percent size={14} />
                        <span>
                          {bulkDiscount.hasDiscount
                            ? `🎉 Bulk Discount Applied! ${bulkDiscount.discountRate}%`
                            : "Bulk Purchase Opportunity"}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "#525252" }}
                      >
                        {bulkDiscount.hasDiscount ? (
                          <>
                            You are saving{" "}
                            <strong>{product.bulkDiscountRate}%</strong> on
                            orders of {product.bulkDiscountQty} or more!
                          </>
                        ) : (
                          <>
                            Order{" "}
                            <strong>{product.bulkDiscountQty} or more</strong>{" "}
                            of this product to get a{" "}
                            <strong>
                              {product.bulkDiscountRate}% discount
                            </strong>
                            !
                            {remainingForBulk > 0 && (
                              <>
                                {" "}
                                Add{" "}
                                <strong style={{ color: "#1b5ea8" }}>
                                  {remainingForBulk} more
                                </strong>{" "}
                                to unlock the bulk discount.
                              </>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                {/* ProductActions */}
                <ProductActions
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleShare}
                  isFavorited={favorited}
                  inStock={product.stock.inStock}
                  sizeStockAvailable={!selectedStock || selectedStock.stock > 0}
                />

                {/* Price Summary — style_design.html design tokens */}
                <div
                  className="p-4 space-y-2"
                  style={{
                    background: "#efeeec",
                    border: "1px solid rgba(30,30,30,0.1)",
                    borderRadius: "14px",
                    boxShadow: "0 1px 2px rgba(30,30,30,0.05)",
                  }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#747474" }}>
                      Unit Price ({quantity} item{quantity !== 1 ? "s" : ""})
                    </span>
                    <span className="font-bold" style={{ color: "#1e1e1e" }}>
                      {subtotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </span>
                  </div>

                  {bulkDiscount.hasDiscount && (
                    <div
                      className="flex justify-between text-sm -mx-4 px-4 py-2"
                      style={{ background: "rgba(13,122,78,0.07)" }}
                    >
                      <span
                        className="font-semibold flex items-center gap-1"
                        style={{ color: "#0d7a4e" }}
                      >
                        <Percent size={14} /> Bulk Discount (
                        {bulkDiscount.discountRate}%)
                      </span>
                      <span className="font-bold" style={{ color: "#0d7a4e" }}>
                        -
                        {(
                          (product.price +
                            (selectedStock?.priceModifier ?? 0)) *
                          quantity *
                          (bulkDiscount.discountRate / 100)
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USD
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#747474" }}>VAT (10%)</span>
                    <span className="font-bold" style={{ color: "#1e1e1e" }}>
                      {vatAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </span>
                  </div>

                  <div
                    className="pt-2 flex justify-between"
                    style={{ borderTop: "1px solid rgba(30,30,30,0.18)" }}
                  >
                    <span
                      className="text-base font-bold"
                      style={{ color: "#1e1e1e" }}
                    >
                      Total (incl. VAT)
                    </span>
                    <span
                      className="text-md font-black"
                      style={{ color: "#c8102e" }}
                    >
                      {totalWithVat.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="flex">
                <div
                  className="space-y-4 pt-4 w-full"
                  style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
                >
                  <div
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: "#9a9a9a" }}
                  >
                    <Info size={14} style={{ color: "#c8102e" }} /> Product
                    Specifications
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        icon: <Award size={16} />,
                        bg: "rgba(27,94,168,0.07)",
                        border: "rgba(27,94,168,0.18)",
                        color: "#1b5ea8",
                        label: "Warranty",
                        value: product.specifications.warranty,
                      },
                      {
                        icon: <BadgeCheck size={16} />,
                        bg: "rgba(13,122,78,0.07)",
                        border: "rgba(13,122,78,0.18)",
                        color: "#0d7a4e",
                        label: "Origin",
                        value: product.specifications.origin,
                      },
                      {
                        icon: <ShieldCheck size={16} />,
                        bg: "rgba(180,83,9,0.07)",
                        border: "rgba(180,83,9,0.18)",
                        color: "#b45309",
                        label: "Certifications",
                        value:
                          product.specifications.certifications.join(", ") ||
                          "—",
                      },
                      {
                        icon: <HardHat size={16} />,
                        bg: "rgba(200,16,46,0.07)",
                        border: "rgba(200,16,46,0.18)",
                        color: "#c8102e",
                        label: "HSE Compliance",
                        value: "Approved",
                      },
                    ].map(({ icon, bg, border, color, label, value }) => (
                      <div
                        key={label}
                        className="p-3 flex items-center gap-3"
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          className="p-2"
                          style={{
                            background: bg,
                            color,
                            borderRadius: "4px",
                          }}
                        >
                          {icon}
                        </div>
                        <div>
                          <div
                            className="text-xs font-bold"
                            style={{ color: "#1e1e1e" }}
                          >
                            {label}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: "#9a9a9a" }}
                          >
                            {value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {product.description && (
                    <div
                      className="prose max-w-none text-[13px] leading-relaxed"
                      style={{ color: "#747474" }}
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meta Statistics ── */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            {
              icon: <Eye size={20} />,
              color: "#c8102e",
              value: product.meta.views,
              label: "Views",
            },
            {
              icon: <Heart size={20} />,
              color: "#c8102e",
              value: product.meta.favorites,
              label: "Favorites",
            },
            {
              icon: <ShoppingCart size={20} />,
              color: "#0d7a4e",
              value: product.meta.purchaseCount,
              label: "Sold",
            },
          ].map(({ icon, color, value, label }) => (
            <div
              key={label}
              className="p-4 text-center"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(30,30,30,0.1)",
                borderRadius: "14px",
                boxShadow:
                  "0 1px 4px rgba(30,30,30,0.06), 0 1px 2px rgba(30,30,30,0.04)",
              }}
            >
              <div
                className="flex items-center justify-center mb-2"
                style={{ color }}
              >
                {icon}
              </div>
              <div className="text-lg font-bold" style={{ color: "#1e1e1e" }}>
                {value}
              </div>
              <div
                className="text-[7px] md:text-[10px] uppercase tracking-wider"
                style={{
                  color: "#9a9a9a",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Related Products ── */}
        {product.relatedProducts.length > 0 && (
          <ProductCarousel
            products={product.relatedProducts}
            title="Related Products"
            icon={<TrendingUp size={20} style={{ color: "#c8102e" }} />}
          />
        )}

        {/* ── More From This Brand ── */}
        {product.brand && product.brandProducts.length > 0 && (
          <ProductCarousel
            products={product.brandProducts}
            title={`More from ${product.brand.name}`}
            icon={<Users size={20} style={{ color: "#c8102e" }} />}
          />
        )}

        {/* ── Tabs ── */}
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
      </div>
    </div>
  );
}
