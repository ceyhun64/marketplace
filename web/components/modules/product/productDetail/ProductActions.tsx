"use client";

import React from "react";
import { Heart, Minus, Plus, Share2, ShoppingCart, Loader2 } from "lucide-react";

interface ProductActionsProps {
  quantity: number;
  maxStock?: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  isFavorited: boolean;
  isFavoriteLoading?: boolean;
  isAddingToCart?: boolean;
  inStock: boolean;
  sizeStockAvailable: boolean;
}

export default function ProductActions({
  quantity,
  maxStock,
  onQuantityChange,
  onAddToCart,
  onToggleFavorite,
  onShare,
  isFavorited,
  isFavoriteLoading = false,
  isAddingToCart = false,
  inStock,
  sizeStockAvailable,
}: ProductActionsProps) {
  const canAddToCart = inStock && sizeStockAvailable;
  const atMaxStock = maxStock !== undefined && maxStock > 0 && quantity >= maxStock;
  const cartDisabled = !canAddToCart || isAddingToCart;

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity + Add to Cart */}
      {quantity > 0 && (
        <div className="flex items-center gap-3">
          {/* Quantity Selector */}
          <div
            className="flex items-center gap-4 px-4 h-12"
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(30,30,30,0.18)",
              borderRadius: "8px",
            }}
          >
            {/* Minus — never go below 1 */}
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              style={{
                color: quantity <= 1 ? "#d0d0d0" : "#747474",
                cursor: quantity <= 1 ? "not-allowed" : "pointer",
                transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={(e) => {
                if (quantity > 1)
                  e.currentTarget.style.color = "#c8102e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = quantity <= 1 ? "#d0d0d0" : "#747474";
              }}
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>

            <span
              className="w-5 text-center text-sm font-bold"
              style={{
                color: "#1e1e1e",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {quantity}
            </span>

            {/* Plus — locked at maxStock */}
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={atMaxStock}
              onClick={() =>
                onQuantityChange(
                  maxStock !== undefined
                    ? Math.min(quantity + 1, maxStock)
                    : quantity + 1,
                )
              }
              title={atMaxStock ? `Maximum available: ${maxStock}` : undefined}
              style={{
                color: atMaxStock ? "#d0d0d0" : "#747474",
                cursor: atMaxStock ? "not-allowed" : "pointer",
                transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={(e) => {
                if (!atMaxStock) e.currentTarget.style.color = "#c8102e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = atMaxStock ? "#d0d0d0" : "#747474";
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Max-stock hint */}
          {atMaxStock && (
            <span
              className="text-[10px] font-semibold"
              style={{ color: "#c8102e", fontFamily: "'JetBrains Mono', monospace" }}
            >
              Max stock reached
            </span>
          )}

          {/* Add to Cart */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={cartDisabled}
            aria-disabled={cartDisabled}
            aria-busy={isAddingToCart}
            className="flex-1 h-12 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: canAddToCart ? "#c8102e" : "rgba(30,30,30,0.07)",
              color: canAddToCart ? "#ffffff" : "#9a9a9a",
              borderRadius: "8px",
              border: "none",
              boxShadow: canAddToCart ? "0 2px 8px rgba(200,16,46,0.2)" : "none",
              cursor: cartDisabled ? "not-allowed" : "pointer",
              opacity: isAddingToCart ? 0.8 : 1,
              transition:
                "background 140ms cubic-bezier(0.16,1,0.3,1), box-shadow 140ms cubic-bezier(0.16,1,0.3,1), opacity 140ms",
              fontFamily: "'Manrope', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (canAddToCart && !isAddingToCart) {
                e.currentTarget.style.background = "#a00d24";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(200,16,46,0.22), 0 2px 8px rgba(200,16,46,0.12)";
              }
            }}
            onMouseLeave={(e) => {
              if (canAddToCart) {
                e.currentTarget.style.background = "#c8102e";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(200,16,46,0.2)";
              }
            }}
          >
            {isAddingToCart ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                {canAddToCart ? "Add to Cart" : "Out of Stock"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Wishlist + Share */}
      <div className="flex gap-3">
        {/* Wishlist / Favorite */}
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={isFavoriteLoading}
          aria-busy={isFavoriteLoading}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          className="flex-1 h-11 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: isFavorited ? "rgba(200,16,46,0.07)" : "#ffffff",
            border: `1.5px solid ${isFavorited ? "rgba(200,16,46,0.25)" : "rgba(30,30,30,0.18)"}`,
            color: isFavorited ? "#c8102e" : "#747474",
            borderRadius: "8px",
            opacity: isFavoriteLoading ? 0.65 : 1,
            cursor: isFavoriteLoading ? "not-allowed" : "pointer",
            transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
            fontFamily: "'Manrope', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!isFavorited && !isFavoriteLoading) {
              e.currentTarget.style.background = "#fafafa";
              e.currentTarget.style.borderColor = "rgba(30,30,30,0.32)";
              e.currentTarget.style.color = "#1e1e1e";
            }
          }}
          onMouseLeave={(e) => {
            if (!isFavorited) {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
              e.currentTarget.style.color = "#747474";
            }
          }}
        >
          {isFavoriteLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Heart
              size={14}
              fill={isFavorited ? "#c8102e" : "none"}
              color={isFavorited ? "#c8102e" : "currentColor"}
            />
          )}
          {isFavoriteLoading
            ? isFavorited
              ? "Removing…"
              : "Saving…"
            : isFavorited
              ? "Saved"
              : "Save to Wishlist"}
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={onShare}
          aria-label="Share product"
          className="w-11 h-11 flex items-center justify-center"
          style={{
            background: "#ffffff",
            border: "1.5px solid rgba(30,30,30,0.18)",
            borderRadius: "8px",
            color: "#747474",
            cursor: "pointer",
            transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#c8102e";
            e.currentTarget.style.color = "#c8102e";
            e.currentTarget.style.background = "rgba(200,16,46,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
            e.currentTarget.style.color = "#747474";
            e.currentTarget.style.background = "#ffffff";
          }}
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}
