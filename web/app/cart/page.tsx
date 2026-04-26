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
import { useCart, useCartSummary } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const inputStyle = {
  flex: 1,
  height: "2.5rem",
  padding: "0 1rem",
  background: "#f5f5f3",
  border: "1.5px solid rgba(51,51,51,0.15)",
  borderRadius: "8px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "0.8125rem",
  color: "#333333",
  outline: "none",
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, setShippingRate, clearCart } =
    useCart();
  const summary = useCartSummary();
  const router = useRouter();
  const [coupon, setCoupon] = useState("");

  if (summary.isEmpty) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#f5f5f3" }}
      >
        <div className="text-center max-w-md">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "#fff",
              boxShadow: "0 4px 16px rgba(51,51,51,0.08)",
            }}
          >
            <ShoppingBag
              className="w-10 h-10"
              style={{ color: "rgba(51,51,51,0.15)" }}
            />
          </div>
          <h1
            className="font-normal mb-3 text-[#333333]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.5rem",
            }}
          >
            Your cart is <em style={{ color: "#c8102e" }}>empty</em>
          </h1>
          <p
            className="mb-8 text-[0.9375rem]"
            style={{ color: "#6b6b6b", fontFamily: "'Manrope', sans-serif" }}
          >
            Discover thousands of products from our sellers and add them to your
            cart.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{
              background: "#333333",
              fontFamily: "'Manrope', sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#c8102e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#333333")}
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4" style={{ background: "#f5f5f3" }}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "#c8102e" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "#6b6b6b" }}
              >
                Shopping
              </span>
            </div>
            <h1
              className="font-normal text-[#333333]"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
              }}
            >
              Shopping <em style={{ color: "#c8102e" }}>Cart</em>
            </h1>
            <p
              className="font-mono text-[12px] mt-1"
              style={{ color: "#6b6b6b" }}
            >
              {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-semibold transition-colors"
            style={{
              color: "#6b6b6b",
              fontFamily: "'Manrope', sans-serif",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c8102e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6b6b")}
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.offerId}
                className="bg-white rounded-2xl p-5 flex gap-5"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                }}
              >
                {/* Product Image */}
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: "#f5f5f3" }}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag
                      className="w-8 h-8"
                      style={{ color: "rgba(51,51,51,0.15)" }}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3
                        className="font-bold text-[15px] leading-tight text-[#333333] truncate"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        {item.productName}
                      </h3>
                      {item.merchantStoreName && (
                        <Link
                          href={`/store/${item.merchantSlug ?? item.merchantId}`}
                          className="font-mono text-[11px] mt-1 inline-block transition-colors"
                          style={{ color: "#c8102e" }}
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
                      onClick={() => removeItem(item.offerId)}
                      className="p-2 rounded-full transition-all flex-shrink-0"
                      style={{ color: "#6b6b6b" }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "#c8102e";
                        el.style.background = "rgba(200,16,46,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "#6b6b6b";
                        el.style.background = "transparent";
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div
                      className="flex items-center gap-1 rounded-lg p-1"
                      style={{ background: "#f5f5f3" }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.offerId, item.quantity - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                        style={{ color: "#333333" }}
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
                        className="w-8 text-center text-sm font-bold font-mono"
                        style={{ color: "#333333" }}
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
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
                        style={{ color: "#333333" }}
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
                        className="text-[18px] font-bold text-[#333333]"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        ₺{(item.price * item.quantity).toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div
                          className="font-mono text-[11px]"
                          style={{ color: "#6b6b6b" }}
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

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Shipping Speed */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
              }}
            >
              <h3
                className="font-bold text-[#333333] mb-4 flex items-center gap-2"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <Truck className="w-4 h-4" style={{ color: "#c8102e" }} />
                Shipping Speed
              </h3>
              <div className="space-y-2">
                {(["REGULAR", "EXPRESS"] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setShippingRate(rate)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor:
                        summary.shippingRate === rate
                          ? "#333333"
                          : "rgba(51,51,51,0.08)",
                      background:
                        summary.shippingRate === rate
                          ? "rgba(51,51,51,0.04)"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {rate === "EXPRESS" ? (
                        <Zap className="w-4 h-4" style={{ color: "#c8102e" }} />
                      ) : (
                        <Truck
                          className="w-4 h-4"
                          style={{ color: "#6b6b6b" }}
                        />
                      )}
                      <div className="text-left">
                        <div
                          className="text-sm font-bold text-[#333333]"
                          style={{ fontFamily: "'Manrope', sans-serif" }}
                        >
                          {rate === "EXPRESS" ? "Express" : "Regular"}
                        </div>
                        <div
                          className="font-mono text-[11px]"
                          style={{ color: "#6b6b6b" }}
                        >
                          {rate === "EXPRESS" ? "1-2 days" : "3-5 days"}
                        </div>
                      </div>
                    </div>
                    <span
                      className="font-bold text-sm text-[#333333]"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1rem",
                      }}
                    >
                      ₺{rate === "EXPRESS" ? "49.90" : "19.90"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
              }}
            >
              <h3
                className="font-bold text-[#333333] mb-4 flex items-center gap-2"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <Tag className="w-4 h-4" style={{ color: "#c8102e" }} />
                Coupon Code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#c8102e";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(51,51,51,0.15)";
                    e.currentTarget.style.background = "#f5f5f3";
                  }}
                />
                <button
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    border: "1.5px solid rgba(51,51,51,0.15)",
                    color: "#333333",
                    background: "transparent",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "#333333";
                    el.style.color = "#fff";
                    el.style.borderColor = "#333333";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "transparent";
                    el.style.color = "#333333";
                    el.style.borderColor = "rgba(51,51,51,0.15)";
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Summary */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
              }}
            >
              <h3
                className="font-bold text-[#333333] mb-5"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-[0.875rem]">
                  <span
                    style={{
                      color: "#6b6b6b",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Subtotal ({summary.itemCount} items)
                  </span>
                  <span className="font-semibold text-[#333333]">
                    ₺{summary.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[0.875rem]">
                  <span
                    style={{
                      color: "#6b6b6b",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Shipping
                  </span>
                  <span className="font-semibold text-[#333333]">
                    ₺{summary.shipping.toFixed(2)}
                  </span>
                </div>
                <div
                  className="flex justify-between pt-4"
                  style={{ borderTop: "1px solid rgba(51,51,51,0.08)" }}
                >
                  <span
                    className="font-bold text-[#333333]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Total
                  </span>
                  <span
                    className="font-bold text-[#333333]"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.5rem",
                    }}
                  >
                    ₺{summary.total.toFixed(2)}
                  </span>
                </div>
                <p
                  className="font-mono text-[10px]"
                  style={{ color: "#6b6b6b" }}
                >
                  VAT included where applicable
                </p>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="w-full mt-5 h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all"
                style={{
                  background: "#333333",
                  fontFamily: "'Manrope', sans-serif",
                  boxShadow: "0 4px 16px rgba(51,51,51,0.12)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#c8102e")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#333333")
                }
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/products"
                className="block text-center font-mono text-[11px] mt-4 transition-colors"
                style={{ color: "#6b6b6b" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#333333")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6b6b")}
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
