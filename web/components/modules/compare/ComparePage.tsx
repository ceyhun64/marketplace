"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitCompare,
  Plus,
  X,
  Check,
  Minus,
  ShoppingCart,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Mock products for demo — in production these come from a global compare store
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Sony WH-1000XM5 Wireless Headphones",
    store: "TechHub Store",
    price: 8499,
    originalPrice: 9999,
    rating: 4.8,
    reviewCount: 342,
    image: null,
    specs: {
      "Noise Cancellation": "Active (Industry Leading)",
      "Battery Life": "30 hours",
      Connectivity: "Bluetooth 5.2, NFC",
      Weight: "250g",
      Foldable: true,
      "Microphone Type": "4 beamforming mics",
      "Driver Size": "30mm",
      Impedance: "47Ω",
      Warranty: "2 Years",
      "Water Resistant": false,
    },
  },
  {
    id: "2",
    name: "Bose QuietComfort 45 Headphones",
    store: "AudioWorld",
    price: 7299,
    originalPrice: 7299,
    rating: 4.6,
    reviewCount: 218,
    image: null,
    specs: {
      "Noise Cancellation": "Active (TriPort)",
      "Battery Life": "24 hours",
      Connectivity: "Bluetooth 5.1",
      Weight: "238g",
      Foldable: true,
      "Microphone Type": "6 mics",
      "Driver Size": "40mm",
      Impedance: "32Ω",
      Warranty: "1 Year",
      "Water Resistant": false,
    },
  },
  {
    id: "3",
    name: "Apple AirPods Max",
    store: "AppleZone TR",
    price: 14999,
    originalPrice: 14999,
    rating: 4.7,
    reviewCount: 156,
    image: null,
    specs: {
      "Noise Cancellation": "Active (H1 chip)",
      "Battery Life": "20 hours",
      Connectivity: "Bluetooth 5.0",
      Weight: "385g",
      Foldable: false,
      "Microphone Type": "9 mics",
      "Driver Size": "40mm",
      Impedance: "NA",
      Warranty: "1 Year",
      "Water Resistant": false,
    },
  },
];

const ALL_SPEC_KEYS = [
  "Noise Cancellation",
  "Battery Life",
  "Connectivity",
  "Weight",
  "Foldable",
  "Microphone Type",
  "Driver Size",
  "Impedance",
  "Warranty",
  "Water Resistant",
];

function formatSpec(val: unknown) {
  if (typeof val === "boolean") {
    return val ? (
      <Check className="w-4 h-4 mx-auto" style={{ color: "#16a34a" }} />
    ) : (
      <X className="w-4 h-4 mx-auto" style={{ color: "#dc2626" }} />
    );
  }
  return <span>{String(val)}</span>;
}

export default function ComparePage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS.slice(0, 2));
  const [showAll, setShowAll] = useState(false);

  const removeProduct = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const addSlot = () => {
    const next = MOCK_PRODUCTS.find((p) => !products.find((pp) => pp.id === p.id));
    if (next) setProducts((prev) => [...prev, next]);
  };

  const visibleSpecs = showAll ? ALL_SPEC_KEYS : ALL_SPEC_KEYS.slice(0, 5);

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div className="max-w-[1300px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-3">
            <GitCompare className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Compare
            </span>
          </div>
          <h1
            className="text-[36px] lg:text-[52px] text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Compare <span style={{ color: "var(--red)" }}>Products</span>
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            Compare up to 3 products side by side. Add products from any product
            page using the{" "}
            <span style={{ color: "var(--red)" }}>Compare</span> button.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-10">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <GitCompare
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "rgba(51,51,51,0.12)" }}
            />
            <p
              className="mb-4"
              style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
            >
              No products to compare.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--red)", fontFamily: "var(--font-body)" }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              {/* Product Cards Row */}
              <thead>
                <tr>
                  <th className="w-40 pr-4" />
                  {products.map((product) => (
                    <th key={product.id} className="pb-6 px-3 align-top">
                      <div
                        className="rounded-2xl bg-white p-5 relative"
                        style={{
                          border: "1px solid rgba(51,51,51,0.07)",
                          boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                        }}
                      >
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(51,51,51,0.06)" }}
                        >
                          <X className="w-3 h-3" style={{ color: "var(--charcoal-soft)" }} />
                        </button>

                        {/* Image placeholder */}
                        <div
                          className="w-full h-28 rounded-xl mb-4 flex items-center justify-center"
                          style={{ background: "var(--off-white-2)" }}
                        >
                          <ShoppingCart
                            className="w-8 h-8"
                            style={{ color: "var(--charcoal-mist)" }}
                          />
                        </div>

                        <p
                          className="text-[10px] mb-1"
                          style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                        >
                          {product.store}
                        </p>
                        <h3
                          className="font-bold text-[0.8125rem] leading-snug mb-3 text-left"
                          style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                        >
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-1 mb-3">
                          <Star
                            className="w-3.5 h-3.5 fill-current"
                            style={{ color: "#f59e0b" }}
                          />
                          <span
                            className="text-xs font-bold"
                            style={{ color: "var(--charcoal)" }}
                          >
                            {product.rating}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: "var(--charcoal-mist)" }}
                          >
                            ({product.reviewCount})
                          </span>
                        </div>

                        <div className="mb-4">
                          <span
                            className="text-lg font-bold"
                            style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                          >
                            {fmt(product.price)}
                          </span>
                          {product.originalPrice > product.price && (
                            <span
                              className="text-xs line-through ml-2"
                              style={{ color: "var(--charcoal-mist)" }}
                            >
                              {fmt(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/product/${product.id}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                          style={{
                            background: "var(--red)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </Link>
                      </div>
                    </th>
                  ))}

                  {/* Add slot */}
                  {products.length < 3 && (
                    <th className="pb-6 px-3 align-top">
                      <button
                        onClick={addSlot}
                        className="w-full rounded-2xl bg-white p-5 flex flex-col items-center justify-center gap-3 transition-shadow h-full min-h-[280px]"
                        style={{
                          border: "1.5px dashed rgba(51,51,51,0.15)",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor = "var(--red)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor = "rgba(51,51,51,0.15)")
                        }
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(200,16,46,0.07)" }}
                        >
                          <Plus className="w-5 h-5" style={{ color: "var(--red)" }} />
                        </div>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
                        >
                          Add Product
                        </span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Specs */}
              <tbody>
                {visibleSpecs.map((specKey, i) => (
                  <tr
                    key={specKey}
                    style={{
                      background: i % 2 === 0 ? "white" : "transparent",
                    }}
                  >
                    <td
                      className="py-3.5 pr-4 text-xs font-semibold rounded-l-xl pl-4"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {specKey}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="py-3.5 px-3 text-center text-sm"
                        style={{
                          color: "var(--charcoal)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {formatSpec(
                          (product.specs as Record<string, unknown>)[specKey] ?? (
                            <Minus className="w-3 h-3 mx-auto" style={{ color: "var(--charcoal-mist)" }} />
                          )
                        )}
                      </td>
                    ))}
                    {products.length < 3 && <td />}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Show more / less */}
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "white",
                  color: "var(--charcoal)",
                  border: "1px solid rgba(51,51,51,0.12)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {showAll ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All Specs <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
