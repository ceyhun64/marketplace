"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart, useCartSummary } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, setShippingRate, clearCart } =
    useCart();
  const summary = useCartSummary();
  const router = useRouter();
  const [coupon, setCoupon] = useState("");

  if (summary.isEmpty) {
    return (
      <main className="min-h-screen bg-[#F5F2EB] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-[#0D0D0D]/20" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0D0D0D] mb-3">
            Your cart is empty
          </h1>
          <p className="text-[#7A7060] mb-8">
            Discover thousands of products from our sellers and add them to your
            cart.
          </p>
          <Button
            asChild
            className="rounded-full bg-[#0D0D0D] hover:bg-[#C84B2F] text-white font-bold px-8 h-12"
          >
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2EB] py-12 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#0D0D0D]">
              Shopping Cart
            </h1>
            <p className="text-[#7A7060] mt-1">
              {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={clearCart}
            className="text-[#C84B2F] hover:bg-[#C84B2F]/10 text-sm font-semibold rounded-full"
          >
            Clear Cart
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Cart Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.offerId}
                className="bg-white rounded-2xl p-5 flex gap-5 shadow-sm border border-black/5"
              >
                {/* Product Image */}
                <div className="w-24 h-24 bg-[#F5F2EB] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-[#0D0D0D]/20" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-[#0D0D0D] text-[15px] leading-tight truncate">
                        {item.productName}
                      </h3>
                      {item.merchantStoreName && (
                        <Link
                          href={`/store/${item.merchantSlug ?? item.merchantId}`}
                          className="text-xs text-[#1A4A6B] font-semibold hover:underline mt-1 inline-block"
                        >
                          {item.merchantStoreName}
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.offerId)}
                      className="p-2 text-[#7A7060] hover:text-[#C84B2F] hover:bg-[#C84B2F]/10 rounded-full transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-1 bg-[#F5F2EB] rounded-full p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.offerId, item.quantity - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.offerId, item.quantity + 1)
                        }
                        disabled={
                          item.stock !== undefined &&
                          item.quantity >= item.stock
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-all disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="text-[18px] font-bold font-serif text-[#0D0D0D]">
                        ₺{(item.price * item.quantity).toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-[#7A7060]">
                          ₺{item.price.toFixed(2)} each
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Shipping Speed */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
              <h3 className="font-bold text-[#0D0D0D] mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#1A4A6B]" />
                Shipping Speed
              </h3>
              <div className="space-y-2">
                {(["REGULAR", "EXPRESS"] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setShippingRate(rate)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                      summary.shippingRate === rate
                        ? "border-[#0D0D0D] bg-[#0D0D0D]/5"
                        : "border-transparent bg-[#F5F2EB] hover:border-[#0D0D0D]/20",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {rate === "EXPRESS" ? (
                        <Zap className="w-4 h-4 text-[#C84B2F]" />
                      ) : (
                        <Truck className="w-4 h-4 text-[#7A7060]" />
                      )}
                      <div className="text-left">
                        <div className="text-sm font-bold">
                          {rate === "EXPRESS" ? "Express" : "Regular"}
                        </div>
                        <div className="text-xs text-[#7A7060]">
                          {rate === "EXPRESS" ? "1-2 days" : "3-5 days"}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold">
                      ₺{rate === "EXPRESS" ? "49.90" : "19.90"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
              <h3 className="font-bold text-[#0D0D0D] mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#2D7A4F]" />
                Coupon Code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 h-10 px-4 rounded-full border border-black/10 text-sm font-mono focus:outline-none focus:border-[#0D0D0D] bg-[#F5F2EB]"
                />
                <Button
                  variant="outline"
                  className="rounded-full border-[#0D0D0D] font-bold text-sm px-5"
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
              <h3 className="font-bold text-[#0D0D0D] mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7060]">
                    Subtotal ({summary.itemCount} items)
                  </span>
                  <span className="font-semibold">
                    ₺{summary.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7060]">Shipping</span>
                  <span className="font-semibold">
                    ₺{summary.shipping.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-black/5 pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold font-serif text-[#0D0D0D]">
                    ₺{summary.total.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-[#7A7060]">
                  VAT included where applicable
                </p>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                className="w-full mt-5 h-12 rounded-full bg-[#0D0D0D] hover:bg-[#C84B2F] text-white font-bold text-[13px] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Link
                href="/product"
                className="block text-center text-xs text-[#7A7060] hover:text-[#0D0D0D] mt-4 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
