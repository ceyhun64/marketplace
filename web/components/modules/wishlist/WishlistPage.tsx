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
  Share2,
  ShoppingCart,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import {
  useWishlist,
  useRemoveFromWishlist,
  useClearWishlist,
} from "@/queries/useWishlist";
import { useLocalWishlist } from "@/hooks/use-wishlist-local";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function WishlistSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-black/5"
        >
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

// -- Guest view ----------------------------------------------------------------

function GuestWishlist() {
  const local = useLocalWishlist();
  const { addItem, hasItem } = useCart();
  const items = local.items;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
        <Heart className="w-16 h-16 text-(--charcoal)/10 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold text-(--charcoal) mb-3">
          Your wishlist is empty
        </h2>
        <p className="text-(--charcoal-soft) mb-8 max-w-sm mx-auto">
          Save the products you love here and find them easily later.
        </p>
        <Button
          asChild
          className="rounded-full bg-(--charcoal) hover:bg-(--red) text-white font-bold px-8 h-12"
        >
          <Link href="/products">Explore Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Sign in banner */}
      <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <LogIn className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          Your favorites are saved on this device. Sign in to access them from
          any device and keep your lists safe.
        </p>
        <Button
          asChild
          size="sm"
          className="shrink-0 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5"
        >
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const inCart = hasItem(item.productId);
          return (
            <div
              key={item.productId}
              className="group relative flex flex-col overflow-hidden bg-white transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Red sweep */}
              <div
                className="absolute inset-x-0 top-0 h-0.75 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10"
                style={{ background: "var(--red)" }}
              />

              {/* Image */}
              <Link href={`/product/${item.productId}`} className="relative block aspect-square overflow-hidden bg-white">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-(--charcoal)/20" />
                  </div>
                )}
              </Link>

              {/* Remove overlay */}
              <div className="absolute right-2.5 top-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => {
                    local.removeItem(item.productId);
                    toast.success(`${item.productName} removed from wishlist.`);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(200,16,46,0.35)",
                    backdropFilter: "blur(4px)",
                  }}
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4 text-(--red)" />
                </button>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <Link href={`/product/${item.productId}`} className="group/title block">
                  <h3
                    className="line-clamp-2 text-sm font-bold leading-snug transition-colors duration-150 text-(--charcoal) group-hover/title:text-(--red)"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {item.productName}
                  </h3>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-2">
                  {item.price != null ? (
                    <span className="text-base font-bold text-(--charcoal) num">
                      {formatPrice(item.price)}
                    </span>
                  ) : (
                    <span className="text-sm text-(--charcoal-soft)">—</span>
                  )}
                  <button
                    onClick={() => {
                      addItem({
                        offerId: item.productId,
                        productId: item.productId,
                        productName: item.productName,
                        productImage: item.productImage,
                        price: item.price ?? 0,
                        merchantId: "",
                      });
                      toast.success(`${item.productName} added to cart!`);
                    }}
                    disabled={inCart}
                    className={cn(
                      "h-11 w-11 sm:h-9 sm:w-9 shrink-0 flex items-center justify-center rounded-lg border transition-all duration-150",
                      inCart
                        ? "bg-(--red) border-(--red) text-white"
                        : "border-[rgba(51,51,51,0.15)] bg-transparent text-(--charcoal) hover:bg-(--red) hover:border-(--red) hover:text-white",
                      "disabled:cursor-not-allowed",
                    )}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => {
            local.clearAll();
            toast.success("Your wishlist has been cleared.");
          }}
          className="inline-flex items-center gap-2 text-sm text-(--red) hover:underline font-semibold"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-(--charcoal) hover:text-(--red) transition-colors"
        >
          Go to Cart
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}

// -- Authenticated user view ---------------------------------------------------

function AuthWishlist() {
  const { addItem, hasItem } = useCart();
  const { data, isLoading, error } = useWishlist();
  const removeMutation = useRemoveFromWishlist();
  const clearMutation = useClearWishlist();

  const items = data?.items ?? [];

  const handleRemove = async (productId: string, productName: string) => {
    try {
      await removeMutation.mutateAsync(productId);
      toast.success(`${productName} removed from wishlist.`);
    } catch {
      toast.error("Could not remove item. Please try again.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearMutation.mutateAsync();
      toast.success("Wishlist cleared.");
    } catch {
      toast.error("Operation failed. Please try again.");
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
    toast.success(`${item.product.name} added to cart!`);
  };

  const handleAddAllToCart = () => {
    const available = items.filter((i) => i.product.stock > 0);
    available.forEach((item) => {
      if (!hasItem(item.productId)) {
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
      }
    });
    toast.success(
      `${available.length} item${available.length !== 1 ? "s" : ""} added to cart!`,
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "My Wishlist", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Wishlist link copied to clipboard!");
    }
  };

  if (isLoading) return <WishlistSkeleton />;

  if (error && !isLoading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
        <Heart className="w-16 h-16 text-(--charcoal)/10 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold text-(--charcoal) mb-3">
          Could not load wishlist
        </h2>
        <p className="text-(--charcoal-soft) mb-8">
          An error occurred. Please try again.
        </p>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-black/5">
        <Heart className="w-16 h-16 text-(--charcoal)/10 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold text-(--charcoal) mb-3">
          Your wishlist is empty
        </h2>
        <p className="text-(--charcoal-soft) mb-8 max-w-sm mx-auto">
          Save the products you love here and find them easily later.
        </p>
        <Button
          asChild
          className="rounded-full bg-(--charcoal) hover:bg-(--red) text-white font-bold px-8 h-12"
        >
          <Link href="/products">Explore Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {items.length > 0 && (
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAddAllToCart}
              className="rounded-full bg-(--charcoal) hover:bg-(--red) text-white gap-2 font-bold"
            >
              <ShoppingCart className="w-4 h-4" />
              Add All to Cart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="rounded-full gap-2 font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Share Wishlist
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={clearMutation.isPending}
            className="text-(--red) hover:text-(--red) hover:bg-red-50 gap-2"
          >
            {clearMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            Clear All
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const inCart = hasItem(item.productId);
          const isOutOfStock = item.product.stock === 0;
          const isLowStock = item.product.stock > 0 && item.product.stock <= 5;
          const coverImage = item.product.images?.[0] ?? null;
          const href = `/product/${item.productId}`;

          return (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden bg-white transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Red sweep */}
              <div
                className="absolute inset-x-0 top-0 h-0.75 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10"
                style={{ background: "var(--red)" }}
              />

              {/* Image */}
              <Link href={href} className="relative block aspect-square overflow-hidden bg-white">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={item.product.name}
                    className={cn(
                      "w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105",
                      isOutOfStock && "opacity-60 grayscale",
                    )}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-(--charcoal)/20" />
                  </div>
                )}
                {isOutOfStock && (
                  <div
                    className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
                    style={{ background: "rgba(245,245,243,0.7)" }}
                  >
                    <span
                      className="rounded-full px-3 py-1 text-xs font-mono font-medium tracking-wide"
                      style={{ background: "rgba(51,51,51,0.08)", color: "var(--charcoal-soft)" }}
                    >
                      Out of Stock
                    </span>
                  </div>
                )}
              </Link>

              {/* Remove overlay */}
              <div className="absolute right-2.5 top-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleRemove(item.productId, item.product.name)}
                  disabled={removeMutation.isPending}
                  className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(200,16,46,0.35)",
                    backdropFilter: "blur(4px)",
                  }}
                  aria-label="Remove from wishlist"
                >
                  {removeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-(--red)" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-(--red)" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <Link
                  href={`/store/${item.product.merchant.slug}`}
                  className="flex items-center gap-1 text-[11px] font-mono tracking-wide transition-colors hover:text-(--red)"
                  style={{ color: "var(--charcoal-soft)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Store className="h-3 w-3 shrink-0" />
                  {item.product.merchant.storeName}
                </Link>

                <Link href={href} className="group/title block">
                  <h3
                    className="line-clamp-2 text-sm font-bold leading-snug transition-colors duration-150 text-(--charcoal) group-hover/title:text-(--red)"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {item.product.name}
                  </h3>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-(--charcoal) num">
                    {formatPrice(item.product.price)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isOutOfStock || inCart}
                    className={cn(
                      "h-11 w-11 sm:h-9 sm:w-9 shrink-0 flex items-center justify-center rounded-lg border transition-all duration-150",
                      inCart
                        ? "bg-(--red) border-(--red) text-white"
                        : "border-[rgba(51,51,51,0.15)] bg-transparent text-(--charcoal) hover:bg-(--red) hover:border-(--red) hover:text-white",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isLowStock && (
                  <p className="font-mono text-[10px] font-medium tracking-wide" style={{ color: "var(--red)" }}>
                    Only {item.product.stock} left!
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-(--charcoal) hover:text-(--red) transition-colors"
        >
          Go to Cart
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}

// -- Page ----------------------------------------------------------------------

export default function WishlistPage() {
  const { user } = useAuth();
  const local = useLocalWishlist();
  const { data } = useWishlist();

  const itemCount = user ? (data?.items?.length ?? 0) : local.count();

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Page header — rose/heart identity */}
      <div
        className="relative overflow-hidden py-10 px-4"
        style={{
          background: "linear-gradient(135deg, #1a0a0e 0%, #200d12 50%, #1a0c10 100%)",
        }}
      >
        {/* Decorative hearts */}
        <Heart
          className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ width: 100, height: 100, color: "rgba(200,16,46,0.07)", fill: "rgba(200,16,46,0.07)" }}
        />
        <Heart
          className="absolute right-32 bottom-2 pointer-events-none select-none"
          style={{ width: 40, height: 40, color: "rgba(200,16,46,0.05)", fill: "rgba(200,16,46,0.05)" }}
        />
        <div
          className="absolute -top-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ border: "20px solid rgba(200,16,46,0.06)" }}
        />
        <div className="max-w-325 mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Heart style={{ width: 14, height: 14, color: "var(--red)", fill: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Saved Items
            </span>
          </div>
          <h1
            className="font-normal leading-tight text-white text-[1.9rem] md:text-[2.4rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My <em style={{ color: "var(--red)" }}>Wishlist</em>
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}
          >
            {itemCount > 0
              ? `${itemCount} item${itemCount !== 1 ? "s" : ""} saved`
              : "No favorites yet"}
          </p>
        </div>
      </div>

      <div className="max-w-325 mx-auto px-4 py-10">
        {/* Content: guest or authenticated */}
        {user ? <AuthWishlist /> : <GuestWishlist />}
      </div>
    </main>
  );
}
