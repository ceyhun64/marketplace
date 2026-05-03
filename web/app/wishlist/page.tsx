"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist, useRemoveFromWishlist, useClearWishlist } from "@/queries/useWishlist";
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

export default function WishlistPage() {
  const { addItem, hasItem } = useCart();
  const { data, isLoading, error } = useWishlist();
  const removeMutation = useRemoveFromWishlist();
  const clearMutation = useClearWishlist();

  const items = data?.items ?? [];

  const handleRemove = async (productId: string, productName: string) => {
    try {
      await removeMutation.mutateAsync(productId);
      toast.success(`${productName} istek listesinden çıkarıldı.`);
    } catch {
      toast.error("Kaldırılamadı, tekrar deneyin.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearMutation.mutateAsync();
      toast.success("İstek listesi temizlendi.");
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
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-7 h-7 text-[var(--red)]" fill="currentColor" />
              <h1 className="text-4xl font-heading font-bold text-[var(--charcoal)]">
                Wishlist
              </h1>
            </div>
            <p className="text-[var(--charcoal-soft)]">
              {isLoading ? "Yükleniyor…" : `${items.length} kayıtlı ürün`}
            </p>
          </div>
          {items.length > 0 && (
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
          )}
        </div>

        {/* Loading */}
        {isLoading && <WishlistSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
            <Heart className="w-16 h-16 text-[var(--charcoal)]/10 mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-bold text-[var(--charcoal)] mb-3">
              Liste yüklenemedi
            </h2>
            <p className="text-[var(--charcoal-soft)] mb-8">
              Giriş yapmanız gerekiyor ya da bir hata oluştu.
            </p>
            <Button asChild className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white font-bold px-8 h-12">
              <Link href="/auth/login">Giriş Yap</Link>
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && items.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
            <Heart className="w-16 h-16 text-[var(--charcoal)]/10 mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-bold text-[var(--charcoal)] mb-3">
              İstek listesi boş
            </h2>
            <p className="text-[var(--charcoal-soft)] mb-8 max-w-sm mx-auto">
              Beğendiğin ürünleri buraya kaydet, sonra kolayca bul.
            </p>
            <Button asChild className="rounded-full bg-[var(--charcoal)] hover:bg-[var(--red)] text-white font-bold px-8 h-12">
              <Link href="/products">Ürünleri Keşfet</Link>
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && items.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 group"
                >
                  {/* Image */}
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

                  {/* Content */}
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
        )}
      </div>
    </main>
  );
}
