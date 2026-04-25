"use client";

import Image from "next/image";
import { useCart, useCartSummary } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { SHIPPING_RATE_LABELS, SHIPPING_COSTS } from "@/types/enums";
import { DEFAULT_VAT_RATE } from "@/lib/constants";

interface Props {
  /** Show condensed version (no item edit) for payment step */
  readonly?: boolean;
}

export default function CartSummary({ readonly }: Props) {
  const { items, removeItem, updateQuantity } = useCart();
  const summary = useCartSummary();

  const vatAmount = summary.subtotal * DEFAULT_VAT_RATE;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-[#0D0D0D]">Order Summary</h3>
        <p className="font-mono text-xs text-[#7A7060] mt-0.5">
          {summary.itemCount} items
        </p>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {items.map((item) => (
          <div key={item.offerId} className="flex gap-3 px-5 py-3">
            {/* Görsel */}
            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>

            {/* Bilgi */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0D0D0D] truncate">
                {item.productName}
              </p>
              <p className="font-mono text-[10px] text-[#7A7060] truncate">
                {item.merchantStoreName}
              </p>

              <div className="flex items-center justify-between mt-1.5">
                {!readonly ? (
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(item.offerId, item.quantity - 1)
                      }
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.offerId, item.quantity + 1)
                      }
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#7A7060]">
                    {item.quantity} adet
                  </span>
                )}
                <span className="font-serif font-semibold text-sm text-[#0D0D0D]">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>

            {!readonly && (
              <button
                onClick={() => removeItem(item.offerId)}
                className="text-gray-300 hover:text-red-400 transition-colors text-sm self-start mt-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Fiyat Özeti */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm text-[#7A7060]">
          <span>Ara toplam</span>
          <span>{formatPrice(summary.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#7A7060]">
          <span>KDV (%20)</span>
          <span>{formatPrice(vatAmount)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#7A7060]">
          <span>Kargo ({SHIPPING_RATE_LABELS[summary.shippingRate]})</span>
          <span>{formatPrice(summary.shipping)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-[#0D0D0D] pt-2 border-t border-gray-100">
          <span className="font-serif">Toplam</span>
          <span className="font-serif text-[#C84B2F]">
            {formatPrice(summary.total + vatAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
