"use client";

import React from "react";
import { Ruler, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

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
  productGroupId: string | null;
  currentProductId: string;
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

  const getSizeStock = (sizeId: number): number => {
    const entry = stockMatrix.find((s) => s.sizeId === sizeId);
    return entry?.stock ?? 0;
  };

  const hasColorOptions = productGroupId && otherColors.length > 0;
  const hasSizeOptions = availableSizes.length > 0;

  if (!hasColorOptions && !hasSizeOptions) return null;

  return (
    <div className="space-y-6">
      {/* RENK SEÇİMİ */}
      {hasColorOptions && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette size={14} style={{ color: "#c8102e" }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
            >
              Renk Seçenekleri
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {/* Mevcut ürün */}
            <button
              className="relative p-1.5"
              title={currentColor?.name || "Mevcut Renk"}
              style={{
                border: "2px solid #c8102e",
                background: "rgba(200,16,46,0.07)",
                borderRadius: "8px",
                cursor: "default",
              }}
            >
              <div
                className="aspect-square overflow-hidden mb-1.5"
                style={{ borderRadius: "4px", background: "#ffffff" }}
              >
                <img
                  src={currentMainImage}
                  alt={currentTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              {currentColor && (
                <div className="flex items-center gap-1 justify-center">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: currentColor.hexCode,
                      border: "1px solid rgba(30,30,30,0.1)",
                    }}
                  />
                  <span
                    className="hidden sm:inline text-[9px] font-semibold truncate"
                    style={{
                      color: "#c8102e",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
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
                title={colorOption.color?.name || colorOption.title}
                className="relative p-1.5 group"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(30,30,30,0.1)",
                  borderRadius: "8px",
                  transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,16,46,0.4)";
                  e.currentTarget.style.background = "rgba(200,16,46,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(30,30,30,0.1)";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <div
                  className="aspect-square overflow-hidden mb-1.5"
                  style={{ borderRadius: "4px", background: "#fafafa" }}
                >
                  <img
                    src={colorOption.mainImage}
                    alt={colorOption.title}
                    className="w-full h-full object-cover"
                    style={{
                      transition: "transform 240ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
                {colorOption.color && (
                  <div className="flex items-center gap-1 justify-center">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: colorOption.color.hexCode,
                        border: "1px solid rgba(30,30,30,0.1)",
                      }}
                    />
                    <span
                      className="hidden sm:inline text-[9px] font-medium truncate max-w-[60px]"
                      style={{
                        color: "#747474",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {colorOption.color.name}
                    </span>
                  </div>
                )}
                {colorOption.hasDiscount && (
                  <div
                    className="absolute top-1 right-1 text-[8px] font-bold px-1 py-0.5"
                    style={{
                      background: "#c8102e",
                      color: "#ffffff",
                      borderRadius: "4px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
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
            <Ruler size={14} style={{ color: "#c8102e" }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
            >
              Beden Seçin
              {selectedSizeId && (
                <span style={{ color: "#c8102e", marginLeft: 8 }}>
                  ({availableSizes.find((s) => s.id === selectedSizeId)?.value})
                </span>
              )}
            </span>
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
                  aria-label={isOutOfStock ? `${size.value} — out of stock` : size.value}
                  className="h-12 font-bold text-sm relative"
                  style={{
                    border: isSelected
                      ? "2px solid #c8102e"
                      : isOutOfStock
                        ? "1.5px solid rgba(30,30,30,0.06)"
                        : "1.5px solid rgba(30,30,30,0.18)",
                    background: isSelected
                      ? "rgba(200,16,46,0.07)"
                      : isOutOfStock
                        ? "#efeeec"
                        : "#ffffff",
                    color: isSelected
                      ? "#c8102e"
                      : isOutOfStock
                        ? "#9a9a9a"
                        : "#1e1e1e",
                    borderRadius: "8px",
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!isOutOfStock && !isSelected) {
                      e.currentTarget.style.borderColor = "rgba(30,30,30,0.32)";
                      e.currentTarget.style.background = "#fafafa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOutOfStock && !isSelected) {
                      e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
                      e.currentTarget.style.background = "#ffffff";
                    }
                  }}
                >
                  {size.value}
                  {isOutOfStock && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ borderRadius: "8px", overflow: "hidden" }}
                    >
                      <div
                        className="w-full h-px rotate-45"
                        style={{ background: "rgba(200,16,46,0.3)" }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seçili Beden Bilgisi */}
      {selectedStock && selectedSizeId && (
        <div
          className="space-y-3 p-4"
          style={{
            background: "#fafafa",
            border: "1px solid rgba(30,30,30,0.1)",
            borderRadius: "8px",
          }}
        >
          <div className="flex justify-between items-center">
            <span
              className="text-sm font-semibold"
              style={{ color: "#525252" }}
            >
              Seçili Beden
            </span>
            <span
              className="text-sm font-bold"
              style={{
                color: "#1e1e1e",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {availableSizes.find((s) => s.id === selectedSizeId)?.value}
            </span>
          </div>

          <div
            className="flex justify-between items-center pt-2"
            style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
          >
            <span className="text-sm" style={{ color: "#747474" }}>
              Stok
            </span>
            <span
              className="text-sm font-bold"
              style={{
                color:
                  selectedStock.stock > 10
                    ? "#0d7a4e"
                    : selectedStock.stock > 0
                      ? "#b45309"
                      : "#c8102e",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {selectedStock.stock > 0
                ? `${selectedStock.stock} adet`
                : "Tükendi"}
            </span>
          </div>

          {selectedStock.priceModifier !== 0 && (
            <div
              className="flex justify-between items-center pt-2"
              style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
            >
              <span className="text-sm" style={{ color: "#747474" }}>
                Fiyat Farkı
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    selectedStock.priceModifier > 0 ? "#b45309" : "#0d7a4e",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {selectedStock.priceModifier > 0 ? "+" : ""}
                {selectedStock.priceModifier.toLocaleString("tr-TR")} TL
              </span>
            </div>
          )}
        </div>
      )}

      {/* Beden Seçim Uyarısı */}
      {!selectedSizeId && hasSizeOptions && (
        <div
          className="p-3"
          style={{
            background: "rgba(180,83,9,0.07)",
            border: "1px solid rgba(180,83,9,0.18)",
            borderRadius: "8px",
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: "#b45309", fontFamily: "'Manrope', sans-serif" }}
          >
            Lütfen bir beden seçin
          </p>
        </div>
      )}
    </div>
  );
}
