"use client";

import React from "react";
import { Ruler, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ---------- İNTERFACES ----------
interface Size {
  id: number;
  value: string;
  type: string;
  sortOrder: number;
}

interface StockEntry {
  id: number;
  sizeId: number | null;
  stock: number;
  priceModifier: number;
}

interface ColorOption {
  id: number;
  title: string;
  price: number;
  oldPrice: number | null;
  mainImage: string;
  color: { id: number; name: string; hexCode: string } | null;
  hasDiscount: boolean;
  discountPercentage: number;
}

interface ProductVariantSelectorProps {
  availableSizes: Size[];
  stockMatrix: StockEntry[];
  selectedSizeId: number | null;
  selectedStock: StockEntry | null;
  onSizeChange: (sizeId: number) => void;
  // Color selection props
  productGroupId: string | null;
  currentProductId: number;
  currentColor: { id: number; name: string; hexCode: string } | null;
  currentMainImage: string;
  currentTitle: string;
  otherColors: ColorOption[];
}

export default function ProductVariantSelector({
  availableSizes,
  stockMatrix,
  selectedSizeId,
  selectedStock,
  onSizeChange,
  productGroupId,
  currentProductId,
  currentColor,
  currentMainImage,
  currentTitle,
  otherColors,
}: ProductVariantSelectorProps) {
  const router = useRouter();

  // Her beden için stok bilgisini stockMatrix'ten çek
  const getSizeStock = (sizeId: number): number => {
    const entry = stockMatrix.find((s) => s.sizeId === sizeId);
    return entry?.stock ?? 0;
  };

  const hasColorOptions = productGroupId && otherColors.length > 0;
  const hasSizeOptions = availableSizes.length > 0;

  // Eğer ne renk ne de beden seçeneği yoksa hiçbir şey gösterme
  if (!hasColorOptions && !hasSizeOptions) return null;

  return (
    <div className="space-y-6">
      {/* RENK SEÇİMİ */}
      {hasColorOptions && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-amber-600" />
            <label className="text-sm font-bold text-slate-900">
              Diğer Renk Seçenekleri
            </label>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {/* Mevcut ürün */}
            <button
              className="relative group border-2 border-slate-600 bg-purple-50 rounded-sm p-1.5 sm:p-2 cursor-default"
              title={currentColor?.name || "Mevcut Renk"}
            >
              <div className="aspect-square rounded overflow-hidden bg-white mb-1 sm:mb-2">
                <img
                  src={currentMainImage}
                  alt={currentTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              {currentColor && (
                <div className="flex items-center gap-1 justify-center">
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-slate-300 flex-shrink-0"
                    style={{ backgroundColor: currentColor.hexCode }}
                  />
                  <span className="hidden sm:inline text-[10px] font-semibold text-purple-700 truncate">
                    {currentColor.name}
                  </span>
                </div>
              )}
            </button>

            {/* Diğer renkler */}
            {otherColors.map((colorOption) => (
              <button
                key={colorOption.id}
                onClick={() => router.push(`/products/${colorOption.id}`)}
                className="relative group bg-white border-2 border-slate-200 hover:border-purple-400 rounded-sm p-1.5 sm:p-2 transition-all"
                title={colorOption.color?.name || colorOption.title}
              >
                <div className="aspect-square rounded overflow-hidden bg-white mb-1 sm:mb-2">
                  <img
                    src={colorOption.mainImage}
                    alt={colorOption.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                {colorOption.color && (
                  <div className="flex items-center gap-1 justify-center">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-slate-300 flex-shrink-0"
                      style={{
                        backgroundColor: colorOption.color.hexCode,
                      }}
                    />
                    <span className="hidden sm:inline text-[10px] font-medium text-slate-600 truncate max-w-[60px]">
                      {colorOption.color.name}
                    </span>
                  </div>
                )}
                {colorOption.hasDiscount && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white text-[8px] font-bold px-1 sm:px-1.5 py-0.5 rounded">
                    -{colorOption.discountPercentage}%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BEDEN SEÇİMİ */}
      {hasSizeOptions && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler size={16} className="text-indigo-600" />
            <label className="text-sm font-bold text-slate-900">
              Beden Seçin
              {selectedSizeId && (
                <span className="ml-2 text-indigo-600">
                  ({availableSizes.find((s) => s.id === selectedSizeId)?.value})
                </span>
              )}
            </label>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {availableSizes.map((size) => {
              const stock = getSizeStock(size.id);
              const isOutOfStock = stock <= 0;
              const isSelected = selectedSizeId === size.id;

              return (
                <button
                  key={size.id}
                  onClick={() => !isOutOfStock && onSizeChange(size.id)}
                  disabled={isOutOfStock}
                  className={cn(
                    "h-12 border-2 rounded-sm font-bold text-sm transition-all relative",
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : isOutOfStock
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white hover:border-slate-400",
                  )}
                >
                  {size.value}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-0.5 bg-red-400 rotate-45" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seçili beden bilgisi */}
      {selectedStock && selectedSizeId && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Seçili Beden:
            </span>
            <span className="text-sm font-bold text-slate-900">
              {availableSizes.find((s) => s.id === selectedSizeId)?.value}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-sm text-slate-600">Stok Durumu:</span>
            <span
              className={cn(
                "text-sm font-bold",
                selectedStock.stock > 10
                  ? "text-emerald-600"
                  : selectedStock.stock > 0
                    ? "text-orange-600"
                    : "text-red-600",
              )}
            >
              {selectedStock.stock > 0
                ? `${selectedStock.stock} adet`
                : "Tükendi"}
            </span>
          </div>

          {selectedStock.priceModifier !== 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-sm text-slate-600">Fiyat Farkı:</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  selectedStock.priceModifier > 0
                    ? "text-orange-600"
                    : "text-emerald-600",
                )}
              >
                {selectedStock.priceModifier > 0 ? "+" : ""}
                {selectedStock.priceModifier.toLocaleString("tr-TR")} TL
              </span>
            </div>
          )}
        </div>
      )}

      {/* Beden seçimi beklendiğinde uyarı */}
      {!selectedSizeId && hasSizeOptions && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3">
          <p className="text-xs text-amber-800 font-medium">
            ⚠️ Lütfen bir beden seçin
          </p>
        </div>
      )}
    </div>
  );
}