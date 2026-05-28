"use client";

import { useCart, useCartSummary } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { SHIPPING_RATE_LABELS } from "@/types/enums";
import { DEFAULT_VAT_RATE } from "@/lib/constants";
import { Package, Minus, Plus } from "lucide-react";

// VAT rate is used to show the included-VAT breakdown for transparency only.
// Product prices are gross (KDV dahil), so VAT is NOT added on top of the total.

interface Props {
  /** Show condensed version (no item edit) for payment step */
  readonly?: boolean;
}

export default function CartSummary({ readonly }: Props) {
  const { items, removeItem, updateQuantity } = useCart();
  const summary = useCartSummary();

  const vatAmount = summary.subtotal * DEFAULT_VAT_RATE;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(51,51,51,0.08)",
        boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid rgba(51,51,51,0.06)" }}
      >
        <h3
          className="font-bold text-(--charcoal)"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Order Summary
        </h3>
        <p className="font-mono text-[11px] text-(--charcoal-soft) mt-0.5">
          {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Items */}
      <div
        className="divide-y max-h-72 overflow-y-auto"
        style={{ borderColor: "rgba(51,51,51,0.04)" }}
      >
        {items.map((item) => (
          <div key={item.offerId} className="flex gap-3 px-5 py-3.5">
            {/* Product image */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
              style={{
                background: "var(--off-white)",
                border: "1px solid rgba(51,51,51,0.06)",
              }}
            >
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package
                  className="w-5 h-5"
                  style={{ color: "rgba(51,51,51,0.2)" }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-semibold text-(--charcoal) truncate"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {item.productName}
              </p>
              {item.merchantStoreName && (
                <p className="font-mono text-[10px] text-(--charcoal-soft) truncate mt-0.5">
                  {item.merchantStoreName}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                {!readonly ? (
                  <div
                    className="flex items-center rounded-lg overflow-hidden"
                    style={{ border: "1px solid rgba(51,51,51,0.12)" }}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(item.offerId, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                      className="w-6 h-6 flex items-center justify-center transition-colors text-(--charcoal-soft) hover:bg-(--off-white)"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span
                      className="w-6 text-center text-[12px] font-bold"
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
                      aria-label="Increase quantity"
                      className="w-6 h-6 flex items-center justify-center transition-colors text-(--charcoal-soft) hover:bg-(--off-white)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-(--charcoal-soft)">
                    × {item.quantity}
                  </span>
                )}

                <span
                  className="font-bold text-[13px] text-(--charcoal)"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>

            {!readonly && (
              <button
                onClick={() => removeItem(item.offerId)}
                aria-label={`Remove ${item.productName} from cart`}
                className="text-(--charcoal-soft) hover:text-(--red) transition-colors self-start mt-1 text-[11px]"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div
        className="px-5 py-4 space-y-2.5"
        style={{ borderTop: "1px solid rgba(51,51,51,0.06)" }}
      >
        <div className="flex justify-between text-[13px]">
          <span style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
            Subtotal
          </span>
          <span className="font-semibold text-(--charcoal)">
            {formatPrice(summary.subtotal)}
          </span>
        </div>

        {/* VAT included — informational only, not charged separately */}
        <div className="flex justify-between text-[13px]">
          <span style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
            VAT (20% incl.)
          </span>
          <span className="font-semibold text-(--charcoal-soft) text-[12px]">
            {formatPrice(vatAmount)}
          </span>
        </div>

        <div className="flex justify-between text-[13px]">
          <span style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
            Shipping ({SHIPPING_RATE_LABELS[summary.shippingRate]})
          </span>
          <span className="font-semibold text-(--charcoal)">
            {summary.shipping === 0 ? (
              <span style={{ color: "#2d7a4f" }}>Free</span>
            ) : (
              formatPrice(summary.shipping)
            )}
          </span>
        </div>

        <div
          className="flex justify-between pt-3"
          style={{ borderTop: "1px solid rgba(51,51,51,0.06)" }}
        >
          <span
            className="font-bold text-(--charcoal)"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Total
          </span>
          <span
            className="font-bold"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              color: "var(--red)",
            }}
          >
            {formatPrice(summary.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
