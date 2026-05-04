"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  Sparkles,
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
} from "lucide-react";
import { toast } from "sonner";
import ProductTabs from "./productTabs";
import ProductDetailSkeleton from "./productDetailSkeleton";
import { useFavorite } from "@/contexts/favoriteContext";
import { addToGuestCart } from "@/utils/cart";
import DesignPanel from "@/components/modules/product/productDetail/design/designPanel";
import ProductImageGallery from "./productImageGallery";
import ProductInfo from "./productInfo";
import ProductVariantSelector from "./productVariantSelector";
import ProductActions from "./productActions";
import ProductCarousel from "./productCarousel";

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
  id: number;
  title: string;
  description: string;
  price: number;
  oldPrice: number | null;
  discountPercentage: number;
  hasDiscount: boolean;
  discountAmount: number;
  mainImage: string;
  images: string[];
  videoUrl: string | null; // ← YENİ
  category: { id: number; name: string };
  middleCategory: { id: number; name: string } | null;
  subCategory: { id: number; name: string } | null;
  brand: { id: number; name: string; image: string | null } | null;
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

export default function ProductDetailPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customDesign, setCustomDesign] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<
    string | null
  >(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);

  const { isFavorited, addFavorite, removeFavorite } = useFavorite();
  const cartDropdownRef = useRef<{ open: () => void; refreshCart: () => void }>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
          setSelectedSizeId(null);
          setSelectedStock(null);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Ürün yükleme hatası:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) {
      setSelectedStock(null);
      return;
    }
    if (product.availableSizes.length > 0) {
      if (selectedSizeId) {
        setSelectedStock(
          product.stockMatrix.find((s) => s.sizeId === selectedSizeId) ?? null,
        );
      } else {
        setSelectedStock(null);
      }
    } else {
      setSelectedStock(
        product.stockMatrix.find((s) => s.sizeId === null) ?? null,
      );
    }
  }, [selectedSizeId, product]);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("/api/account/check", {
          credentials: "include",
        });
        if (!res.ok) return setIsLoggedIn(false);
        const data = await res.json();
        setIsLoggedIn(!!data.user?.id);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  const calculateBulkDiscount = () => {
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
  };

  const handleSaveDesign = (designUrl: string) => {
    setCustomDesign(designUrl);
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setActiveIndex(0);
    toast.success("Tasarımınız kaydedildi! Sepete ekleyebilirsiniz.");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }
    setUploadedImage(file);
    setCustomDesign(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
      setActiveIndex(0);
    };
    reader.readAsDataURL(file);
    toast.success("Resim yüklendi! Sepete ekleyebilirsiniz.");
  };

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

    const finalCustomImage = customDesign || uploadedImagePreview;
    const bulkDiscount = calculateBulkDiscount();
    let basePrice = product.price + (selectedStock?.priceModifier ?? 0);
    if (bulkDiscount.hasDiscount)
      basePrice = basePrice * (1 - bulkDiscount.discountRate / 100);

    if (!isLoggedIn) {
      addToGuestCart(
        product.id,
        finalCustomImage ? `${product.title} (Özelleştirilmiş)` : product.title,
        basePrice,
        finalCustomImage || product.mainImage,
        product.category.name,
        quantity,
        selectedSizeId,
        finalCustomImage,
        product.bulkDiscountQty,
        product.bulkDiscountRate,
      );
      toast.success(
        bulkDiscount.hasDiscount
          ? `${quantity} adet ürün sepete eklendi! 🎉 %${bulkDiscount.discountRate} toplu alım indirimi uygulandı!`
          : `${quantity} adet ürün sepete eklendi!`,
      );
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("productId", product.id.toString());
      formData.append("quantity", quantity.toString());
      if (selectedSizeId) formData.append("sizeId", selectedSizeId.toString());
      if (customDesign) formData.append("customImage", customDesign);
      else if (uploadedImage) formData.append("customImageFile", uploadedImage);

      const res = await fetch("/api/cart", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        toast.success(
          bulkDiscount.hasDiscount
            ? `${quantity} adet ürün sepete eklendi! 🎉 %${bulkDiscount.discountRate} toplu alım indirimi uygulandı!`
            : `${quantity} adet ürün sepete eklendi!`,
        );
        window.dispatchEvent(new CustomEvent("cartUpdated"));
        cartDropdownRef.current?.open?.();
      } else {
        const error = await res.json();
        toast.error(error.error || "Sepete ekleme hatası.");
      }
    } catch {
      toast.error("Sepete ekleme hatası.");
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
      toast.success("Bağlantı kopyalandı!");
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product)
    return (
      <div className="h-screen flex items-center justify-center">
        Ürün bulunamadı.
      </div>
    );

  const finalCustomImage = customDesign || uploadedImagePreview;
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
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {showPreview && (
        <DesignPanel
          productImage={product.images[0] || product.mainImage}
          onClose={() => setShowPreview(false)}
          onSaveDesign={handleSaveDesign}
          onDirectUpload={() => fileInputRef.current?.click()}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="mx-auto px-6 pb-20 pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Galeri */}
          <div className="lg:col-span-6 lg:sticky lg:top-20 lg:self-start lg:z-40">
            {/* ← YENİ: videoUrl prop eklendi */}
            <ProductImageGallery
              images={product.images}
              videoUrl={product.videoUrl}
              activeIndex={activeIndex}
              onIndexChange={setActiveIndex}
              customDesign={customDesign}
              uploadedImagePreview={uploadedImagePreview}
              hasDiscount={product.hasDiscount}
              discountPercentage={product.discountPercentage}
              onShowPreview={() => setShowPreview(true)}
              onRemoveCustomDesign={() => {
                setCustomDesign(null);
                toast.info("Özel tasarım kaldırıldı.");
              }}
              onRemoveUploadedImage={() => {
                setUploadedImage(null);
                setUploadedImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                toast.info("Yüklenen resim kaldırıldı.");
              }}
              productTitle={product.title}
            />
          </div>

          {/* Ürün Bilgileri */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <div className="space-y-8">
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
                hasCustomImage={!!finalCustomImage}
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

                {finalCustomImage && (
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 p-4 rounded space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider">
                      <Sparkles size={14} /> Özelleştirilmiş Ürün
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bu ürün{" "}
                      {customDesign
                        ? "tasarım paneliyle"
                        : "yüklediğiniz resimle"}{" "}
                      özelleştirilmiştir.
                    </p>
                  </div>
                )}

                {product.bulkDiscountQty !== null &&
                  product.bulkDiscountRate !== null &&
                  product.bulkDiscountQty > 0 &&
                  product.bulkDiscountRate > 0 && (
                    <div
                      className={`border p-4 rounded space-y-2 ${
                        bulkDiscount.hasDiscount
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <Percent
                          size={14}
                          className={
                            bulkDiscount.hasDiscount
                              ? "text-emerald-700"
                              : "text-blue-700"
                          }
                        />
                        <span
                          className={
                            bulkDiscount.hasDiscount
                              ? "text-emerald-700"
                              : "text-blue-700"
                          }
                        >
                          {bulkDiscount.hasDiscount
                            ? `🎉 Toplu Alım İndirimi Uygulandı! %${bulkDiscount.discountRate}`
                            : "Toplu Alım Fırsatı"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
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
                                <strong className="text-blue-700">
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

                <ProductActions
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={() =>
                    isFavorited(product.id)
                      ? removeFavorite(product.id)
                      : addFavorite(product.id)
                  }
                  onShare={handleShare}
                  onUploadImage={() => fileInputRef.current?.click()}
                  isFavorited={isFavorited(product.id)}
                  hasUploadedImage={!!uploadedImagePreview}
                  inStock={product.stock.inStock}
                  sizeStockAvailable={!selectedStock || selectedStock.stock > 0}
                />

                <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Ürün Fiyatı ({quantity} adet)
                    </span>
                    <span className="font-bold text-slate-900">
                      {subtotal.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
                    </span>
                  </div>
                  {bulkDiscount.hasDiscount && (
                    <div className="flex justify-between text-sm bg-emerald-50 -mx-4 px-4 py-2">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Percent size={14} /> Toplu Alım İndirimi (%
                        {bulkDiscount.discountRate})
                      </span>
                      <span className="font-bold text-emerald-700">
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
                    <span className="text-slate-600">KDV (%10)</span>
                    <span className="font-bold text-slate-900">
                      {vatAmount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between">
                    <span className="text-base font-bold text-slate-900">
                      Toplam (KDV Dahil)
                    </span>
                    <span className="text-md font-black text-orange-600">
                      {totalWithVat.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex">
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Info size={14} className="text-orange-600" /> Ürün
                    Özellikleri
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        icon: <Award size={16} />,
                        color: "blue",
                        label: "Garanti",
                        value: product.specifications.warranty,
                      },
                      {
                        icon: <BadgeCheck size={16} />,
                        color: "emerald",
                        label: "Menşei",
                        value: product.specifications.origin,
                      },
                      {
                        icon: <ShieldCheck size={16} />,
                        color: "orange",
                        label: "Sertifikalar",
                        value: product.specifications.certifications.join(", "),
                      },
                      {
                        icon: <HardHat size={16} />,
                        color: "purple",
                        label: "İSG Uyumu",
                        value: "Onaylı",
                      },
                    ].map(({ icon, color, label, value }) => (
                      <div
                        key={label}
                        className="p-3 bg-slate-50/50 border border-slate-100 flex items-center gap-3"
                      >
                        <div
                          className={`p-2 bg-${color}-100 text-${color}-600`}
                        >
                          {icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {label}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="prose prose-slate max-w-none text-slate-600 text-[13px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            {
              icon: <Eye size={20} />,
              color: "text-orange-600",
              value: product.meta.views,
              label: "Görüntülenme",
            },
            {
              icon: <Heart size={20} />,
              color: "text-pink-600",
              value: product.meta.favorites,
              label: "Favori",
            },
            {
              icon: <ShoppingCart size={20} />,
              color: "text-emerald-600",
              value: product.meta.purchaseCount,
              label: "Satıldı",
            },
          ].map(({ icon, color, value, label }) => (
            <div
              key={label}
              className="bg-white border border-slate-100 p-4 rounded text-center"
            >
              <div className={`flex items-center justify-center ${color} mb-2`}>
                {icon}
              </div>
              <div className="text-lg font-bold text-slate-900">{value}</div>
              <div className="text-[7px] md:text-[10px] text-slate-500 uppercase tracking-wider">
                {label}
              </div>
            </div>
          ))}
        </div>

        {product.relatedProducts.length > 0 && (
          <ProductCarousel
            products={product.relatedProducts}
            title="Benzer Ürünler"
            icon={<TrendingUp size={20} className="text-orange-600" />}
          />
        )}

        {product.brand && product.brandProducts.length > 0 && (
          <ProductCarousel
            products={product.brandProducts}
            title={`${product.brand.name} Markalı Diğer Ürünler`}
            icon={<Users size={20} className="text-orange-600" />}
          />
        )}

        <div className="mt-12 pt-8 border-t border-slate-100">
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
