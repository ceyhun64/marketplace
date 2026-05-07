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
} from "lucide-react";
import { useCart, useCartSummary } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

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

  const handleApplyCoupon = () => {
    if (coupon.trim()) setCouponApplied(true);
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
            className="font-normal mb-4 text-[var(--charcoal)]"
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
    <main
      className="min-h-screen py-12 px-4"
      style={{ background: "var(--off-white)" }}
    >
      <div className="max-w-[1300px] mx-auto">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
              style={{
                color: "var(--charcoal-soft)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--charcoal)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--charcoal-soft)")
              }
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Continue Shopping
            </button>

            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Shopping
              </span>
            </div>
            <h1
              className="font-normal text-[var(--charcoal)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
              }}
            >
              Shopping <em style={{ color: "var(--red)" }}>Cart</em>
            </h1>
            <p
              className="font-mono text-[12px] mt-2"
              style={{ color: "var(--charcoal-soft)" }}
            >
              {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-sm font-semibold transition-colors mt-2"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--charcoal-soft)")
            }
          >
            Clear All
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* ── Cart Items ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.offerId}
                className="bg-white rounded-2xl p-5 flex gap-5 transition-all duration-300"
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
                  className="w-[100px] h-[100px] rounded-xl flex-shrink-0 overflow-hidden"
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
                        className="font-bold text-[15px] leading-tight text-[var(--charcoal)] truncate"
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
                      className="p-2 rounded-full transition-all flex-shrink-0"
                      style={{ color: "var(--charcoal-soft)" }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "var(--red)";
                        el.style.background = "rgba(187,16,35,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "var(--charcoal-soft)";
                        el.style.background = "transparent";
                      }}
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
                        className="text-[1.25rem] font-bold text-[var(--charcoal)]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        ₺{(item.price * item.quantity).toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div
                          className="font-mono text-[11px]"
                          style={{ color: "var(--charcoal-soft)" }}
                        >
                          ₺{item.price.toFixed(2)} each
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
                className="font-bold text-[var(--charcoal)] mb-4 flex items-center gap-2"
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
                          className="text-sm font-bold text-[var(--charcoal)]"
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
                        className="font-bold text-[var(--charcoal)]"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.1rem",
                        }}
                      >
                        ₺{rate === "EXPRESS" ? "49.90" : "19.90"}
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
                className="font-bold text-[var(--charcoal)] mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <Tag className="w-4 h-4" style={{ color: "var(--red)" }} />
                Coupon Code
              </h3>

              {couponApplied ? (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(45,122,79,0.06)",
                    border: "1px solid rgba(45,122,79,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className="w-4 h-4"
                      style={{ color: "#2d7a4f" }}
                    />
                    <span
                      className="font-mono text-[12px] font-bold"
                      style={{ color: "#2d7a4f" }}
                    >
                      {coupon} applied
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCouponApplied(false);
                      setCoupon("");
                    }}
                    className="font-mono text-[11px] transition-colors"
                    style={{
                      color: "var(--charcoal-soft)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--red)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--charcoal-soft)")
                    }
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
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
                    style={{
                      border: "1.5px solid rgba(51,51,51,0.15)",
                      color: "var(--charcoal)",
                      background: "transparent",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "var(--charcoal)";
                      el.style.color = "#fff";
                      el.style.borderColor = "var(--charcoal)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "transparent";
                      el.style.color = "var(--charcoal)";
                      el.style.borderColor = "rgba(51,51,51,0.15)";
                    }}
                  >
                    Apply
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
                className="font-bold text-[var(--charcoal)] mb-5"
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
                    Subtotal ({summary.itemCount} items)
                  </span>
                  <span className="font-semibold text-[var(--charcoal)]">
                    ₺{summary.subtotal.toFixed(2)}
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
                  <span className="font-semibold text-[var(--charcoal)]">
                    ₺{summary.shipping.toFixed(2)}
                  </span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-[0.875rem]">
                    <span
                      style={{
                        color: "#2d7a4f",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Discount ({coupon})
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "#2d7a4f" }}
                    >
                      –₺0.00
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-4"
                  style={{ borderTop: "1px solid rgba(51,51,51,0.08)" }}
                >
                  <span
                    className="font-bold text-[var(--charcoal)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Total
                  </span>
                  <span
                    className="font-bold text-[var(--charcoal)]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.6rem",
                    }}
                  >
                    ₺{summary.total.toFixed(2)}
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
                className="w-full mt-6 h-13 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all"
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
