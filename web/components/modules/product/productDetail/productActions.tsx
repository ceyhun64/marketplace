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
          <div className="flex items-center bg-white h-12 px-4 gap-5 border border-slate-200 rounded-sm">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="text-slate-500 hover:text-orange-600 transition-colors"
            >
              <Minus size={14} strokeWidth={3} />
            </button>
            <span className="w-4 text-center text-sm font-bold text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="text-slate-500 hover:text-orange-600 transition-colors"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>

          <button
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={cn(
              "flex-1 h-12 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2",
              canAddToCart
                ? "bg-slate-900 text-white hover:bg-orange-600"
                : "bg-slate-200 text-slate-400 cursor-not-allowed",
            )}
          >
            <ShoppingCart size={14} fill="currentColor" />
            {canAddToCart ? "Sepete Ekle" : "Stokta Yok"}
          </button>
        </div>
      )}

      {/* Favori + Paylaş */}
      <div className="flex gap-3">
        <button
          onClick={onToggleFavorite}
          className={cn(
            "flex-1 h-11 border rounded-sm flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all",
            isFavorited
              ? "bg-slate-50 border-slate-200 text-slate-900"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
          )}
        >
          <Heart
            size={14}
            className={cn(isFavorited && "fill-orange-500 text-orange-500")}
          />
          {isFavorited ? "Listede" : "Listeye Ekle"}
        </button>
        <button
          onClick={onShare}
          className="w-11 h-11 rounded-sm bg-white border border-slate-200 flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-all shadow-sm"
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}
