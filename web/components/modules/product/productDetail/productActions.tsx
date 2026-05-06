"use client";

import React from "react";
import { Heart, Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  isFavorited: boolean;
  inStock: boolean;
  sizeStockAvailable: boolean;
}

export default function ProductActions({
  quantity,
  onQuantityChange,
  onAddToCart,
  onToggleFavorite,
  onShare,
  isFavorited,
  inStock,
  sizeStockAvailable,
}: ProductActionsProps) {
  const canAddToCart = inStock && sizeStockAvailable;

  return (
    <div className="flex flex-col gap-3">
      {/* Miktar + Sepete Ekle */}
      {quantity > 0 && (
        <div className="flex items-center gap-3">
          {/* Adet Seçici */}
          <div
            className="flex items-center gap-4 px-4 h-12"
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(30,30,30,0.18)",
              borderRadius: "8px",
            }}
          >
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              style={{
                color: "#747474",
                transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c8102e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#747474")}
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
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              style={{
                color: "#747474",
                transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c8102e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#747474")}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Sepete Ekle */}
          <button
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className="flex-1 h-12 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: canAddToCart ? "#c8102e" : "rgba(30,30,30,0.07)",
              color: canAddToCart ? "#ffffff" : "#9a9a9a",
              borderRadius: "8px",
              border: "none",
              boxShadow: canAddToCart
                ? "0 2px 8px rgba(200,16,46,0.2)"
                : "none",
              cursor: canAddToCart ? "pointer" : "not-allowed",
              transition:
                "background 140ms cubic-bezier(0.16,1,0.3,1), box-shadow 140ms cubic-bezier(0.16,1,0.3,1)",
              fontFamily: "'Manrope', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (canAddToCart) {
                e.currentTarget.style.background = "#a00d24";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(200,16,46,0.22), 0 2px 8px rgba(200,16,46,0.12)";
              }
            }}
            onMouseLeave={(e) => {
              if (canAddToCart) {
                e.currentTarget.style.background = "#c8102e";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(200,16,46,0.2)";
              }
            }}
          >
            <ShoppingCart size={14} />
            {canAddToCart ? "Sepete Ekle" : "Stokta Yok"}
          </button>
        </div>
      )}

      {/* Favori + Paylaş */}
      <div className="flex gap-3">
        <button
          onClick={onToggleFavorite}
          className="flex-1 h-11 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: isFavorited ? "rgba(200,16,46,0.07)" : "#ffffff",
            border: `1.5px solid ${isFavorited ? "rgba(200,16,46,0.25)" : "rgba(30,30,30,0.18)"}`,
            color: isFavorited ? "#c8102e" : "#747474",
            borderRadius: "8px",
            transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
            fontFamily: "'Manrope', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!isFavorited) {
              e.currentTarget.style.background = "#f7f6f4";
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
          <Heart
            size={14}
            fill={isFavorited ? "#c8102e" : "none"}
            color={isFavorited ? "#c8102e" : "currentColor"}
          />
          {isFavorited ? "Favorilerde" : "Favorilere Ekle"}
        </button>

        <button
          onClick={onShare}
          className="w-11 h-11 flex items-center justify-center"
          style={{
            background: "#ffffff",
            border: "1.5px solid rgba(30,30,30,0.18)",
            borderRadius: "8px",
            color: "#747474",
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
