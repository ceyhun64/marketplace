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
  ArrowLeft,
  Tag,
  Truck,
  Zap,
  Package,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCart, useCartSummary } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { SHIPPING_COSTS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import api from "@/lib/api";

const inputStyle: React.CSSProperties = {
  flex: 1,
  height: "2.5rem",
  padding: "0 1rem",
  background: "var(--off-white)",
  border: "1.5px solid rgba(51,51,51,0.15)",
  borderRadius: "10px",
  fontFamily: "var(--font-mono)",
  fontSize: "0.8125rem",
  color: "var(--charcoal)",
  outline: "none",
  transition: "border-color 0.15s, background 0.15s",
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, setShippingRate, clearCart } =
    useCart();
  const summary = useCartSummary();
  const router = useRouter();
  const { user } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleCheckout = () => {
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  const handleRemove = (offerId: string) => {
    setRemovingId(offerId);
    setTimeout(() => {
      removeItem(offerId);
      setRemovingId(null);
    }, 250);
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post("/api/coupon/validate", {
        code: coupon.trim(),
        orderTotal: summary.subtotal,
      });
      setCouponDiscount(data.calculatedDiscount);
      setCouponApplied(true);
      toast.success(`Coupon applied! You save $${data.calculatedDiscount.toFixed(2)}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid coupon code.";
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Empty State ────────────────────────────────────────────────────────────

  if (summary.isEmpty) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--off-white)" }}
      >
        <div className="text-center max-w-md">
          {/* Icon */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{
              background: "#fff",
              boxShadow: "0 8px 32px rgba(51,51,51,0.08)",
            }}
          >
            <ShoppingBag
              className="w-12 h-12"
              style={{ color: "rgba(51,51,51,0.12)" }}
            />
          </div>

          <div
            className="font-mono text-[11px] tracking-[0.18em] uppercase mb-3"
            style={{ color: "var(--charcoal-soft)" }}
          >
            Nothing here yet
          </div>

          <h1
            className="font-normal mb-4 text-(--charcoal)"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              lineHeight: 1.1,
            }}
          >
            Your cart is <em style={{ color: "var(--red)" }}>empty</em>
          </h1>

          <p
            className="mb-10 text-[0.9375rem] leading-relaxed"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            Discover thousands of products from our verified sellers and add
            your favorites to cart.
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "var(--charcoal)",
              fontFamily: "var(--font-body)",
              boxShadow: "0 4px 20px rgba(51,51,51,0.15)",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--red)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--charcoal)")
            }
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  // ── Cart ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Dark header — navy/commerce identity */}
      <div
        className="relative overflow-hidden py-10 px-4"
        style={{
          background:
            "linear-gradient(135deg, #080c18 0%, #0c1220 50%, #080b16 100%)",
        }}
      >
        {/* Decorative rings */}
        <div
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none"
          style={{ border: "24px solid rgba(96,165,250,0.09)" }}
        />
        <div
          className="absolute -bottom-16 left-32 w-36 h-36 rounded-full pointer-events-none"
          style={{ border: "16px solid rgba(96,165,250,0.06)" }}
        />
        {/* Large ShoppingBag watermark */}
        <ShoppingBag
          className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ width: 120, height: 120, color: "rgba(96,165,250,0.05)" }}
        />
        {/* Bottom accent */}
        <div
          className="absolute bottom-0 left-0 w-full h-0.5 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(96,165,250,0.4) 0%, transparent 55%)",
          }}
        />

        <div className="max-w-325 mx-auto relative z-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.75)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.45)")
                }
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Continue Shopping
              </button>

              <div className="inline-flex items-center gap-2 mb-3">
                <ShoppingBag
                  style={{
                    width: 14,
                    height: 14,
                    color: "rgba(96,165,250,0.9)",
                  }}
                />
                <span
                  className="font-mono text-[10px] uppercase tracking-[3px]"
                  style={{ color: "rgba(96,165,250,0.6)" }}
                >
                  My Cart
                </span>
              </div>
              <h1
                className="font-normal leading-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                Shopping <em style={{ color: "rgba(96,165,250,0.9)" }}>Cart</em>
              </h1>
              <p
                className="font-mono text-[12px] mt-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={clearCart}
              className="text-sm font-semibold transition-colors"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-body)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(239,68,68,0.8)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
              }
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-325 mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* ── Cart Items ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.offerId}
                className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 transition-all duration-300"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                  opacity: removingId === item.offerId ? 0 : 1,
                  transform:
                    removingId === item.offerId ? "translateX(20px)" : "none",
                }}
              >
                {/* Product Image */}
                <div
                  className="w-full sm:w-25 h-48 sm:h-25 rounded-xl shrink-0 overflow-hidden"
                  style={{ background: "var(--off-white)" }}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package
                        className="w-8 h-8"
                        style={{ color: "rgba(51,51,51,0.15)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3
                        className="font-bold text-[15px] leading-tight text-(--charcoal) truncate"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {item.productName}
                      </h3>
                      {item.merchantStoreName && (
                        <Link
                          href={`/store/${item.merchantSlug ?? item.merchantId}`}
                          className="font-mono text-[11px] mt-1 inline-block transition-opacity"
                          style={{ color: "var(--red)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.7")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          {item.merchantStoreName}
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.offerId)}
                      className="p-2 rounded-full transition-all shrink-0 text-(--charcoal-soft) hover:text-(--red) hover:bg-[rgba(187,16,35,0.08)] min-h-11 min-w-11 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-5">
                    {/* Quantity stepper */}
                    <div
                      className="flex items-center rounded-xl p-1 gap-0.5"
                      style={{ background: "var(--off-white)" }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.offerId, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{ color: "var(--charcoal)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className="w-9 text-center text-sm font-bold"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--charcoal)",
                        }}
                      >
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
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
                        style={{ color: "var(--charcoal)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div
                        className="text-[1.25rem] font-bold text-(--charcoal)"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div
                          className="font-mono text-[11px]"
                          style={{
                            color: "var(--charcoal-soft)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ${item.price.toFixed(2)} each
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Right Column ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Shipping Speed */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
              }}
            >
              <h3
                className="font-bold text-(--charcoal) mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <Truck className="w-4 h-4" style={{ color: "var(--red)" }} />
                Shipping Speed
              </h3>
              <div className="space-y-2">
                {(["REGULAR", "EXPRESS"] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setShippingRate(rate)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor:
                        summary.shippingRate === rate
                          ? "var(--charcoal)"
                          : "rgba(51,51,51,0.08)",
                      background:
                        summary.shippingRate === rate
                          ? "rgba(51,51,51,0.04)"
                          : "#fff",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            summary.shippingRate === rate
                              ? rate === "EXPRESS"
                                ? "rgba(187,16,35,0.1)"
                                : "rgba(51,51,51,0.08)"
                              : "var(--off-white)",
                        }}
                      >
                        {rate === "EXPRESS" ? (
                          <Zap
                            className="w-4 h-4"
                            style={{ color: "var(--red)" }}
                          />
                        ) : (
                          <Truck
                            className="w-4 h-4"
                            style={{ color: "var(--charcoal-soft)" }}
                          />
                        )}
                      </div>
                      <div className="text-left">
                        <div
                          className="text-sm font-bold text-(--charcoal)"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {rate === "EXPRESS" ? "Express" : "Regular"}
                        </div>
                        <div
                          className="font-mono text-[10px]"
                          style={{ color: "var(--charcoal-soft)" }}
                        >
                          {rate === "EXPRESS"
                            ? "1–2 business days"
                            : "3–5 business days"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="font-bold text-(--charcoal)"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.1rem",
                        }}
                      >
                        {formatPrice(SHIPPING_COSTS[rate])}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
              }}
            >
              <h3
                className="font-bold text-(--charcoal) mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <Tag className="w-4 h-4" style={{ color: "var(--red)" }} />
                Coupon Code
              </h3>

              {couponApplied ? (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(51,51,51,0.03)",
                    border: "1px solid rgba(51,51,51,0.1)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Tag
                      className="w-4 h-4"
                      style={{ color: "var(--charcoal-soft)" }}
                    />
                    <span
                      className="font-mono text-[12px]"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      {coupon} — -${couponDiscount.toFixed(2)} off
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCouponApplied(false);
                      setCoupon("");
                      setCouponDiscount(0);
                    }}
                    className="font-mono text-[11px] transition-colors bg-transparent border-none cursor-pointer text-(--charcoal-soft) hover:text-(--red)"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--charcoal)";
                      e.currentTarget.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(51,51,51,0.15)";
                      e.currentTarget.style.background = "var(--off-white)";
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !coupon.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 border border-[rgba(51,51,51,0.15)] text-(--charcoal) bg-transparent hover:bg-(--charcoal) hover:text-white hover:border-(--charcoal) min-h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
              }}
            >
              <h3
                className="font-bold text-(--charcoal) mb-5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-[0.875rem]">
                  <span
                    style={{
                      color: "var(--charcoal-soft)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Subtotal ({summary.itemCount} item
                    {summary.itemCount !== 1 ? "s" : ""})
                  </span>
                  <span
                    className="font-semibold text-(--charcoal)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatPrice(summary.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[0.875rem]">
                  <span
                    style={{
                      color: "var(--charcoal-soft)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Shipping (
                    {summary.shippingRate === "EXPRESS" ? "Express" : "Regular"}
                    )
                  </span>
                  <span
                    className="font-semibold text-(--charcoal)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatPrice(summary.shipping)}
                  </span>
                </div>
                {couponApplied && couponDiscount > 0 && (
                  <div className="flex justify-between text-[0.875rem]">
                    <span style={{ color: "#0d7a4e", fontFamily: "var(--font-body)" }}>
                      Coupon ({coupon})
                    </span>
                    <span className="font-semibold" style={{ color: "#0d7a4e", fontVariantNumeric: "tabular-nums" }}>
                      -{formatPrice(couponDiscount)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-4"
                  style={{ borderTop: "1px solid rgba(51,51,51,0.08)" }}
                >
                  <span
                    className="font-bold text-(--charcoal)"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Total
                  </span>
                  <span
                    className="font-bold text-(--charcoal)"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.6rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatPrice(Math.max(0, summary.total - couponDiscount))}
                  </span>
                </div>
                <p
                  className="font-mono text-[10px]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  VAT included where applicable
                </p>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full mt-6 h-13 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all bg-(--charcoal) hover:bg-(--red)"
                style={{
                  fontFamily: "var(--font-body)",
                  boxShadow: "var(--shadow-md)",
                  letterSpacing: "0.02em",
                }}
              >
                {user ? "Complete Order" : "Sign In & Place Order"}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Guest info note */}
              {!user && (
                <p
                  className="mt-3 text-center font-mono text-[10px]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Your cart will be saved on this device until you sign in.
                </p>
              )}

              {/* Trust signals */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div
                  className="flex items-center gap-1.5 font-mono text-[10px]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  Secure Checkout
                </div>
                <div
                  className="w-px h-3"
                  style={{ background: "rgba(51,51,51,0.12)" }}
                />
                <div
                  className="flex items-center gap-1.5 font-mono text-[10px]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  <Truck className="w-3 h-3" />
                  Free Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
