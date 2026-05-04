"use client";

import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Loader2,
  X,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist, useRemoveFromWishlist, useClearWishlist } from "@/queries/useWishlist";
import { useLocalWishlist } from "@/hooks/use-wishlist-local";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function WishlistSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-black/5">
          <Skeleton className="aspect-square w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Guest (misafir) görünümü ──────────────────────────────────────────────────

function GuestWishlist() {
  const local = useLocalWishlist();
  const { addItem, hasItem } = useCart();
  const items = local.items;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
        <Heart className="w-16 h-16 text-[var(--charcoal)]/10 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold text-[var(--charcoal)] mb-3">
          İstek listesi boş
        </h2>
        <p className="text-[var(--charcoal-soft)] mb-8 max-w-sm mx-auto">
          Beğendiğin ürünleri buraya kaydet, sonra kolayca bul.
        </p>
        <Button
          asChild
          className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white font-bold px-8 h-12"
        >
          <Link href="/products">Ürünleri Keşfet</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Giriş yapma uyarısı */}
      <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <LogIn className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          Favorileriniz bu cihaza kaydedildi. Hesabınıza giriş yaparak tüm
          cihazlardan erişin ve listelerinizi koruyun.
        </p>
        <Button
          asChild
          size="sm"
          className="flex-shrink-0 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5"
        >
          <Link href="/auth/login">Giriş Yap</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 group"
          >
            {/* Görsel */}
            <div className="aspect-square relative flex items-center justify-center bg-gray-50">
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
                onClick={() => {
                  local.removeItem(item.productId);
                  toast.success(`${item.productName} favorilerden çıkarıldı.`);
                }}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[var(--red)] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--red)] hover:text-white"
                aria-label="Favorilerden çıkar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* İçerik */}
            <div className="p-5">
              <h3 className="font-bold text-[var(--charcoal)] mb-1 leading-tight">
                {item.productName}
              </h3>

              <div className="flex items-center justify-between mt-3">
                {item.price != null ? (
                  <span className="text-xl font-bold font-heading text-[var(--charcoal)]">
                    ₺{item.price.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm text-[var(--charcoal-soft)]">—</span>
                )}
                <Button
                  onClick={() => {
                    addItem({
                      offerId: item.productId,
                      productId: item.productId,
                      productName: item.productName,
                      productImage: item.productImage,
                      price: item.price ?? 0,
                      merchantId: "",
                    });
                    toast.success(`${item.productName} sepete eklendi!`);
                  }}
                  disabled={hasItem(item.productId)}
                  className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white text-xs font-bold px-5 h-9 transition-all disabled:opacity-60"
                >
                  {hasItem(item.productId) ? "Sepette ✓" : "Sepete Ekle"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => {
            local.clearAll();
            toast.success("Favori listeniz temizlendi.");
          }}
          className="inline-flex items-center gap-2 text-sm text-[var(--red)] hover:underline font-semibold"
        >
          <X className="w-4 h-4" />
          Tümünü Temizle
        </button>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors"
        >
          Sepete Git
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}

// ── Giriş yapılmış kullanıcı görünümü ────────────────────────────────────────

function AuthWishlist() {
  const { addItem, hasItem } = useCart();
  const { data, isLoading, error } = useWishlist();
  const removeMutation = useRemoveFromWishlist();
  const clearMutation = useClearWishlist();

  const items = data?.items ?? [];

  const handleRemove = async (productId: string, productName: string) => {
    try {
      await removeMutation.mutateAsync(productId);
      toast.success(`${productName} favorilerden çıkarıldı.`);
    } catch {
      toast.error("Kaldırılamadı, tekrar deneyin.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearMutation.mutateAsync();
      toast.success("Favori listesi temizlendi.");
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  const handleAddToCart = (item: (typeof items)[0]) => {
    addItem({
      offerId: item.productId,
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.images?.[0] ?? "",
      price: item.product.price,
      merchantId: "",
      merchantStoreName: item.product.merchant.storeName,
      merchantSlug: item.product.merchant.slug,
      stock: item.product.stock,
      source: "MARKETPLACE" as const,
    });
    toast.success(`${item.product.name} sepete eklendi!`);
  };

  if (isLoading) return <WishlistSkeleton />;

  if (error && !isLoading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
        <Heart className="w-16 h-16 text-[var(--charcoal)]/10 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold text-[var(--charcoal)] mb-3">
          Liste yüklenemedi
        </h2>
        <p className="text-[var(--charcoal-soft)] mb-8">Bir hata oluştu, lütfen tekrar deneyin.</p>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
        <Heart className="w-16 h-16 text-[var(--charcoal)]/10 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold text-[var(--charcoal)] mb-3">
          Favori listeniz boş
        </h2>
        <p className="text-[var(--charcoal-soft)] mb-8 max-w-sm mx-auto">
          Beğendiğin ürünleri buraya kaydet, sonra kolayca bul.
        </p>
        <Button
          asChild
          className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white font-bold px-8 h-12"
        >
          <Link href="/products">Ürünleri Keşfet</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {items.length > 0 && (
        <div className="mb-6 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={clearMutation.isPending}
            className="text-[var(--red)] hover:text-[var(--red)] hover:bg-red-50 gap-2"
          >
            {clearMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            Tümünü Temizle
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 group"
          >
            {/* Görsel */}
            <div className="aspect-square relative flex items-center justify-center bg-gray-50">
              {item.product.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-12 h-12 text-[var(--charcoal)]/20" />
              )}
              <button
                onClick={() => handleRemove(item.productId, item.product.name)}
                disabled={removeMutation.isPending}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[var(--red)] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--red)] hover:text-white"
              >
                {removeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* İçerik */}
            <div className="p-5">
              <Link
                href={`/store/${item.product.merchant.slug}`}
                className="text-xs font-mono text-[var(--charcoal-mid)] font-bold uppercase tracking-wider hover:underline"
              >
                {item.product.merchant.storeName}
              </Link>
              <h3 className="font-bold text-[var(--charcoal)] mt-1 mb-3 leading-tight">
                {item.product.name}
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-heading text-[var(--charcoal)]">
                  ₺{item.product.price.toFixed(2)}
                </span>
                <Button
                  onClick={() => handleAddToCart(item)}
                  disabled={hasItem(item.productId)}
                  className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white text-xs font-bold px-5 h-9 transition-all disabled:opacity-60"
                >
                  {hasItem(item.productId) ? "Sepette ✓" : "Sepete Ekle"}
                </Button>
              </div>

              {item.product.stock <= 3 && item.product.stock > 0 && (
                <p className="text-xs text-[var(--red)] font-semibold mt-2">
                  Son {item.product.stock} adet!
                </p>
              )}
              {item.product.stock === 0 && (
                <p className="text-xs text-gray-400 font-semibold mt-2">Stok Tükendi</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors"
        >
          Sepete Git
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const { user } = useAuth();
  const local = useLocalWishlist();
  const { data } = useWishlist(); // enabled: !!user sayesinde sadece giriş yapılmışsa çalışır

  const itemCount = user ? (data?.items?.length ?? 0) : local.count();

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-[1300px] mx-auto">
        {/* Başlık */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-7 h-7 text-[var(--red)]" fill="currentColor" />
              <h1 className="text-4xl font-heading font-bold text-[var(--charcoal)]">
                Favorilerim
              </h1>
            </div>
            <p className="text-[var(--charcoal-soft)]">
              {itemCount > 0 ? `${itemCount} ürün kaydedildi` : "Henüz favori yok"}
            </p>
          </div>
        </div>

        {/* İçerik: misafir veya giriş yapmış */}
        {user ? <AuthWishlist /> : <GuestWishlist />}
      </div>
    </main>
  );
}
