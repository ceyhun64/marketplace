"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Truck,
  Zap,
  Tag,
  X,
} from "lucide-react";
import { useCart, useCartSummary, type CartItem } from "@/hooks/use-cart";
import { useUI } from "@/hooks/use-ui";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";

// -- Component -----------------------------------------------------------------

export default function CartDrawer() {
  const { cartOpen, closeCart } = useUI();
  const { items, removeItem, updateQuantity, shippingRate, setShippingRate } = useCart();
  const summary = useCartSummary();
  const { user } = useAuth();
  const router   = useRouter();

  const handleCheckout = useCallback(() => {
    closeCart();
    if (!user) router.push("/auth/login?redirect=/checkout");
    else       router.push("/checkout");
  }, [closeCart, user, router]);

  const isEmpty = items.length === 0;

  return (
    <Sheet open={cartOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* -- Header -- */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-(--border-light) shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--charcoal)" }}
              >
                <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-base font-semibold text-(--text-primary)">
                Your Cart
              </span>
              {!isEmpty && (
                <Badge
                  className="ml-1 h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold bg-(--charcoal) text-white border-0"
                >
                  {summary.itemCount}
                </Badge>
              )}
            </SheetTitle>
            <button
              type="button"
              onClick={closeCart}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-(--off-white-2) transition-colors text-(--text-tertiary)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </SheetHeader>

        {/* -- Body -- */}
        {isEmpty ? (
          <EmptyCart onClose={closeCart} />
        ) : (
          <>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-5 py-4 space-y-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.offerId}
                    item={item}
                    onRemove={() => removeItem(item.offerId)}
                    onIncrease={() =>
                      updateQuantity(item.offerId, item.quantity + 1)
                    }
                    onDecrease={() => {
                      if (item.quantity > 1)
                        updateQuantity(item.offerId, item.quantity - 1);
                      else removeItem(item.offerId);
                    }}
                  />
                ))}
              </div>

              {/* -- Shipping selector -- */}
              <div className="px-5 pb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-(--text-tertiary) mb-2.5">
                  Shipping
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["REGULAR", "EXPRESS"] as const).map((rate) => {
                    const isActive = shippingRate === rate;
                    return (
                      <button
                        key={rate}
                        onClick={() => setShippingRate(rate)}
                        className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all duration-150 ${
                          isActive
                            ? "border-(--charcoal) bg-(--charcoal)/5"
                            : "border-(--border-light) hover:border-(--border-mid)"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {rate === "EXPRESS" ? (
                            <Zap className="w-3 h-3 text-(--warning)" />
                          ) : (
                            <Truck className="w-3 h-3 text-(--text-tertiary)" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              isActive ? "text-(--text-primary)" : "text-(--text-secondary)"
                            }`}
                          >
                            {rate === "EXPRESS" ? "Express" : "Standard"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-(--text-primary) tabular-nums">
                          {formatPrice(rate === "EXPRESS" ? 59.9 : 29.9)}
                        </span>
                        <span className="text-[10px] text-(--text-tertiary)">
                          {rate === "EXPRESS" ? "1–2 days" : "3–5 days"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>

            {/* -- Footer: Order summary + CTA -- */}
            <div
              className="shrink-0 px-5 pt-4 pb-5 border-t border-(--border-light) space-y-3"
              style={{ background: "var(--off-white-2)" }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--text-secondary)">Subtotal</span>
                  <span className="font-semibold text-(--text-primary) tabular-nums">
                    {formatPrice(summary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--text-secondary)">Shipping</span>
                  <span className="font-semibold text-(--text-primary) tabular-nums">
                    {formatPrice(summary.shipping)}
                  </span>
                </div>
                <Separator className="bg-(--border-light) my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-(--text-primary)">Total</span>
                  <span className="text-lg font-bold text-(--text-primary) tabular-nums">
                    {formatPrice(summary.total)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full h-12 rounded-2xl font-bold text-sm uppercase tracking-wider gap-2 group shadow-lg"
                style={{ background: "var(--charcoal)", color: "#fff" }}
              >
                <span>Checkout</span>
                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  strokeWidth={2.5}
                />
              </Button>

              <Link
                href="/cart"
                onClick={closeCart}
                className="block text-center text-xs font-medium text-(--text-tertiary) hover:text-(--text-primary) transition-colors pt-0.5"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// -- Cart item row -------------------------------------------------------------

function CartItemRow({
  item,
  onRemove,
  onIncrease,
  onDecrease,
}: {
  item: CartItem;
  onRemove:   () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl bg-(--bg-surface) border border-(--border-light) group hover:border-(--border-mid) transition-colors"
    >
      {/* Thumbnail */}
      <Link
        href={`/product/${item.productId}`}
        className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-(--off-white-2) border border-(--border-light)"
      >
        {item.productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-(--border-mid)" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Link
          href={`/product/${item.productId}`}
          className="text-sm font-semibold text-(--text-primary) leading-tight line-clamp-2 hover:text-(--red) transition-colors"
        >
          {item.productName}
        </Link>
        {item.merchantStoreName && (
          <p className="text-[11px] text-(--text-tertiary) flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            {item.merchantStoreName}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          {/* Quantity stepper — min 44px touch target per button on mobile */}
          <div className="flex items-center gap-1 rounded-lg overflow-hidden border border-(--border-light)">
            <button
              type="button"
              onClick={onDecrease}
              className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-(--off-white-2) transition-colors text-(--text-secondary)"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 sm:w-7 text-center text-sm font-bold text-(--text-primary) tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center transition-colors text-(--text-secondary)"
              style={{
                opacity: item.stock != null && item.quantity >= item.stock ? 0.35 : 1,
                cursor: item.stock != null && item.quantity >= item.stock ? "not-allowed" : undefined,
              }}
              aria-label="Increase quantity"
              aria-disabled={item.stock != null && item.quantity >= item.stock}
              disabled={item.stock != null && item.quantity >= item.stock}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price */}
          <span className="text-sm font-bold text-(--text-primary) tabular-nums">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-(--text-tertiary) transition-all"
        aria-label="Remove item"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// -- Empty state ---------------------------------------------------------------

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: "var(--off-white-2)" }}
      >
        <ShoppingBag className="w-9 h-9 text-(--border-mid)" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-base font-bold text-(--text-primary) mb-1.5">
          Your cart is empty
        </p>
        <p className="text-sm text-(--text-tertiary) max-w-52">
          Start adding products from our marketplace or your favourite stores.
        </p>
      </div>
      <Button
        onClick={onClose}
        asChild
        className="mt-2 h-11 px-8 rounded-2xl font-bold text-sm uppercase tracking-wider"
        style={{ background: "var(--charcoal)", color: "#fff" }}
      >
        <Link href="/products">Explore Products</Link>
      </Button>
    </div>
  );
}
