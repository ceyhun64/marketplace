"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProduct } from "@/queries/useProducts";
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
} from "lucide-react";
import { toast } from "sonner";
import ProductTabs from "@/components/modules/product/productDetail/productTabs";
import ProductDetailSkeleton from "@/components/modules/product/productDetail/productDetailSkeleton";
import ProductImageGallery from "@/components/modules/product/productDetail/productImageGallery";
import ProductInfo from "@/components/modules/product/productDetail/productInfo";
import ProductVariantSelector from "@/components/modules/product/productDetail/productVariantSelector";
import ProductActions from "@/components/modules/product/productDetail/productActions";
import ProductCarousel from "@/components/modules/product/productDetail/productCarousel";
import { useHybridWishlist } from "@/hooks/use-hybrid-wishlist";
import { useAuth } from "@/hooks/use-auth";

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
 * ProductData — sistem mimarisindeki Product entity'si ile hizalanmış.
 * Domain/Entities/Product.cs:
 *   Id, MerchantId, Name, Description, CategoryId, Images, Tags,
 *   Price, Stock, PublishToMarket, PublishToStore, IsApproved, IsDeleted
 *
 * MerchantProfile (brand bilgisi için):
 *   StoreName, Slug, LogoUrl, CustomDomain
 *
 * Category (self-ref hiyerarşi):
 *   Id, Name, Slug, ParentId → subcategory zinciri
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
  // Category hierarchy — mimarideki self-ref Category tablosuna karşılık gelir
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
  // Publish kanalları — mimarideki PublishToMarket / PublishToStore alanları
  publishToMarket: boolean;
  publishToStore: boolean;
  // IsApproved — admin onayı
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

// ── Guest Cart Helper ─────────────────────────────────────────────────────────

interface GuestCartItem {
  productId: string;
  title: string;
  price: number;
  mainImage: string;
  category: string;
  quantity: number;
  sizeId: number | null;
  variantId: number | null;
  bulkDiscountQty: number | null;
  bulkDiscountRate: number | null;
}

function addToGuestCart(
  productId: string,
  title: string,
  price: number,
  mainImage: string,
  category: string,
  quantity: number,
  sizeId: number | null,
  variantId: number | null,
  bulkDiscountQty: number | null,
  bulkDiscountRate: number | null,
): void {
  try {
    const raw = localStorage.getItem("guest_cart");
    const cart: GuestCartItem[] = raw ? JSON.parse(raw) : [];
    const existingIdx = cart.findIndex(
      (item) => item.productId === productId && item.sizeId === sizeId,
    );
    if (existingIdx >= 0) {
      cart[existingIdx].quantity += quantity;
    } else {
      cart.push({
        productId,
        title,
        price,
        mainImage,
        category,
        quantity,
        sizeId,
        variantId,
        bulkDiscountQty,
        bulkDiscountRate,
      });
    }
    localStorage.setItem("guest_cart", JSON.stringify(cart));
  } catch (err) {
    console.error("Guest cart error:", err);
  }
}

// ── Channel Badges ────────────────────────────────────────────────────────────
// PublishToMarket / PublishToStore / IsApproved görünürlük göstergesi

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
          E-Mağaza
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
          Onaylı
        </span>
      )}
    </div>
  );
}

// ── Tag Chips ─────────────────────────────────────────────────────────────────
// Product.Tags List<string> alanını render eder

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

  // useProduct hook — GET /api/products/{id} endpoint'ine bağlanır
  const { data: rawProduct, isLoading: loading } = useProduct(productId);

  /**
   * Backend response mapping:
   * GET /api/products/{id} → { data: { id, name, description, price, stock,
   *   images[], tags[], category, merchant, publishToMarket, publishToStore,
   *   isApproved, ... } }
   *
   * Fiyat ve stok doğrudan Product tablosundan gelir (Offer yapısı yok).
   * MerchantProfile: storeName, slug, logoUrl, customDomain
   * Category: self-ref hiyerarşi (ana → orta → alt)
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
      reviews: Array.isArray(r.reviews) ? r.reviews : [],
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

  // ── Sepete Ekle ─────────────────────────────────────────────────────────────

  const handleAddToCart = async () => {
    if (!product) {
      toast.error("Ürün bilgisi bulunamadı.");
      return;
    }
    if (product.availableSizes.length > 0 && !selectedSizeId) {
      toast.error("Lütfen bir beden seçin.");
      return;
    }
    if (selectedStock && selectedStock.stock <= 0) {
      toast.error("Seçilen beden stokta yok.");
      return;
    }

    const bulkDiscount = calculateBulkDiscount();
    let basePrice = product.price + (selectedStock?.priceModifier ?? 0);
    if (bulkDiscount.hasDiscount)
      basePrice = basePrice * (1 - bulkDiscount.discountRate / 100);

    const successMsg = bulkDiscount.hasDiscount
      ? `${quantity} adet ürün sepete eklendi! 🎉 %${bulkDiscount.discountRate} toplu alım indirimi uygulandı!`
      : `${quantity} adet ürün sepete eklendi!`;

    if (!user) {
      addToGuestCart(
        product.id,
        product.title,
        basePrice,
        product.mainImage,
        product.category.name,
        quantity,
        selectedSizeId,
        null,
        product.bulkDiscountQty,
        product.bulkDiscountRate,
      );
      toast.success(successMsg);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("productId", product.id.toString());
      formData.append("quantity", quantity.toString());
      if (selectedSizeId) formData.append("sizeId", selectedSizeId.toString());

      const res = await fetch("/api/cart", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        toast.success(successMsg);
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } else {
        const error = await res.json();
        toast.error(error.error || "Sepete ekleme hatası.");
      }
    } catch {
      toast.error("Sepete ekleme hatası.");
    }
  };

  // ── Favorilere Ekle/Çıkar ───────────────────────────────────────────────────

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
        toast.success(`"${product.title}" favorilere eklendi`, {
          description: !user
            ? "Giriş yaptığınızda listanız hesabınıza aktarılacak."
            : undefined,
          duration: !user ? 4000 : 2000,
        });
      } else {
        toast.success(`"${product.title}" favorilerden çıkarıldı`, {
          duration: 2000,
        });
      }
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ── Paylaş ──────────────────────────────────────────────────────────────────

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
      toast.success("Bağlantı kopyalandı!");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <ProductDetailSkeleton />;
  if (!product)
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "#f7f6f4" }}
      >
        <div className="text-center space-y-4">
          <p
            className="text-2xl font-bold"
            style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
          >
            Ürün bulunamadı.
          </p>
          <p className="text-sm" style={{ color: "#9a9a9a" }}>
            Bu ürün kaldırılmış veya mevcut değil olabilir.
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
     * Tasarım sistemi: style_design.html v2.0
     * Renkler : --red #c8102e | --charcoal #1e1e1e | --off-white #f7f6f4
     * Fontlar : Manrope (body) | Cormorant Garamond (display) | JetBrains Mono (mono)
     * Gölgeler: shadow-sm / shadow-md / shadow-red
     * Radius  : radius-md 8px | radius-lg 14px
     * Motion  : dur-fast 140ms | ease-out cubic-bezier(0.16,1,0.3,1)
     */
    <div
      className="min-h-screen"
      style={{
        background: "#f7f6f4",
        color: "#1e1e1e",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <div className="mx-auto px-6 pb-20 pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Galeri ── */}
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

          {/* ── Ürün Bilgileri ── */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <div className="space-y-8">
              {/* Kanal etiketleri (PublishToMarket, PublishToStore, IsApproved) + Tags */}
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

                {/* Toplu Alım Fırsatı */}
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
                            ? `🎉 Toplu Alım İndirimi Uygulandı! %${bulkDiscount.discountRate}`
                            : "Toplu Alım Fırsatı"}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "#525252" }}
                      >
                        {bulkDiscount.hasDiscount ? (
                          <>
                            Bu üründen {product.bulkDiscountQty} adet ve üzeri
                            alımlarda{" "}
                            <strong>%{product.bulkDiscountRate}</strong> indirim
                            kazanıyorsunuz!
                          </>
                        ) : (
                          <>
                            Bu üründen{" "}
                            <strong>{product.bulkDiscountQty} adet</strong> ve
                            üzeri alımlarda{" "}
                            <strong>%{product.bulkDiscountRate} indirim</strong>{" "}
                            kazanın!
                            {remainingForBulk > 0 && (
                              <>
                                {" "}
                                Toplu alım için{" "}
                                <strong style={{ color: "#1b5ea8" }}>
                                  {remainingForBulk} adet
                                </strong>{" "}
                                daha ekleyin.
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

                {/* Fiyat Özeti — style_design.html design tokens */}
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
                      Ürün Fiyatı ({quantity} adet)
                    </span>
                    <span className="font-bold" style={{ color: "#1e1e1e" }}>
                      {subtotal.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
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
                        <Percent size={14} /> Toplu Alım İndirimi (%
                        {bulkDiscount.discountRate})
                      </span>
                      <span className="font-bold" style={{ color: "#0d7a4e" }}>
                        -
                        {(
                          (product.price +
                            (selectedStock?.priceModifier ?? 0)) *
                          quantity *
                          (bulkDiscount.discountRate / 100)
                        ).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TL
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#747474" }}>KDV (%10)</span>
                    <span className="font-bold" style={{ color: "#1e1e1e" }}>
                      {vatAmount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
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
                      Toplam (KDV Dahil)
                    </span>
                    <span
                      className="text-md font-black"
                      style={{ color: "#c8102e" }}
                    >
                      {totalWithVat.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
                    </span>
                  </div>
                </div>
              </div>

              {/* Ürün Özellikleri */}
              <div className="flex">
                <div
                  className="space-y-4 pt-4 w-full"
                  style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
                >
                  <div
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: "#9a9a9a" }}
                  >
                    <Info size={14} style={{ color: "#c8102e" }} /> Ürün
                    Özellikleri
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        icon: <Award size={16} />,
                        bg: "rgba(27,94,168,0.07)",
                        border: "rgba(27,94,168,0.18)",
                        color: "#1b5ea8",
                        label: "Garanti",
                        value: product.specifications.warranty,
                      },
                      {
                        icon: <BadgeCheck size={16} />,
                        bg: "rgba(13,122,78,0.07)",
                        border: "rgba(13,122,78,0.18)",
                        color: "#0d7a4e",
                        label: "Menşei",
                        value: product.specifications.origin,
                      },
                      {
                        icon: <ShieldCheck size={16} />,
                        bg: "rgba(180,83,9,0.07)",
                        border: "rgba(180,83,9,0.18)",
                        color: "#b45309",
                        label: "Sertifikalar",
                        value:
                          product.specifications.certifications.join(", ") ||
                          "—",
                      },
                      {
                        icon: <HardHat size={16} />,
                        bg: "rgba(200,16,46,0.07)",
                        border: "rgba(200,16,46,0.18)",
                        color: "#c8102e",
                        label: "İSG Uyumu",
                        value: "Onaylı",
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

        {/* ── Meta İstatistikler ── */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            {
              icon: <Eye size={20} />,
              color: "#c8102e",
              value: product.meta.views,
              label: "Görüntülenme",
            },
            {
              icon: <Heart size={20} />,
              color: "#c8102e",
              value: product.meta.favorites,
              label: "Favori",
            },
            {
              icon: <ShoppingCart size={20} />,
              color: "#0d7a4e",
              value: product.meta.purchaseCount,
              label: "Satıldı",
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

        {/* ── Benzer Ürünler ── */}
        {product.relatedProducts.length > 0 && (
          <ProductCarousel
            products={product.relatedProducts}
            title="Benzer Ürünler"
            icon={<TrendingUp size={20} style={{ color: "#c8102e" }} />}
          />
        )}

        {/* ── Markadan Diğer Ürünler ── */}
        {product.brand && product.brandProducts.length > 0 && (
          <ProductCarousel
            products={product.brandProducts}
            title={`${product.brand.name} Markalı Diğer Ürünler`}
            icon={<Users size={20} style={{ color: "#c8102e" }} />}
          />
        )}

        {/* ── Sekmeler ── */}
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
