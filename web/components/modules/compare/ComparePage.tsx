"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitCompare,
  X,
  Check,
  Minus,
  ShoppingCart,
  Star,
  ChevronDown,
  ChevronUp,
  Home,
  ChevronRight,
  Package,
  Trash2,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { useCompareStore, type CompareItem, MAX_COMPARE } from "@/hooks/use-compare";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";

// ── Spec definitions ──────────────────────────────────────────────────────────
type SpecDef = {
  key: string;
  label: string;
  render: (item: CompareItem) => React.ReactNode;
  compareMode?: "lower" | "higher" | "bool";
  numericExtract?: (item: CompareItem) => number | null;
};

const SPEC_DEFS: SpecDef[] = [
  {
    key: "rating",
    label: "Rating",
    compareMode: "higher",
    numericExtract: (i) => i.rating,
    render: (i) =>
      i.rating > 0 ? (
        <span className="flex items-center justify-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{i.rating.toFixed(1)}</span>
          <span style={{ color: "var(--charcoal-mist)", fontSize: 11 }}>
            ({i.reviewCount})
          </span>
        </span>
      ) : (
        <span style={{ color: "var(--charcoal-mist)" }}>No reviews</span>
      ),
  },
  {
    key: "stock",
    label: "Stock",
    compareMode: "higher",
    numericExtract: (i) => i.stock.quantity,
    render: (i) =>
      i.stock.inStock ? (
        <span
          className="inline-flex items-center gap-1 font-semibold"
          style={{ color: "#15803d" }}
        >
          <Check className="w-3.5 h-3.5" />
          {i.stock.quantity > 0 ? `${i.stock.quantity} units` : "In Stock"}
        </span>
      ) : (
        <span className="font-semibold" style={{ color: "#dc2626" }}>
          Out of Stock
        </span>
      ),
  },
  {
    key: "category",
    label: "Category",
    render: (i) => i.categoryName || <EmDash />,
  },
  {
    key: "store",
    label: "Store",
    render: (i) =>
      i.merchantSlug ? (
        <Link
          href={`/store/${i.merchantSlug}`}
          className="hover:underline inline-flex items-center gap-1"
          style={{ color: "var(--charcoal)" }}
        >
          {i.merchantName}
          <ExternalLink className="w-3 h-3" style={{ color: "var(--charcoal-mist)" }} />
        </Link>
      ) : (
        <span>{i.merchantName || <EmDash />}</span>
      ),
  },
  {
    key: "shipping",
    label: "Shipping",
    compareMode: "bool",
    numericExtract: (i) => (i.shipping.freeShipping ? 1 : 0),
    render: (i) =>
      i.shipping.freeShipping ? (
        <span className="font-semibold" style={{ color: "#15803d" }}>
          Free
        </span>
      ) : (
        <span style={{ color: "var(--charcoal-soft)" }}>Paid</span>
      ),
  },
  {
    key: "weight",
    label: "Weight",
    render: (i) => i.specifications.weight || <EmDash />,
  },
  {
    key: "dimensions",
    label: "Dimensions",
    render: (i) => i.specifications.dimensions || <EmDash />,
  },
  {
    key: "material",
    label: "Material",
    render: (i) => i.specifications.material || <EmDash />,
  },
  {
    key: "warranty",
    label: "Warranty",
    render: (i) => i.specifications.warranty || <EmDash />,
  },
  {
    key: "origin",
    label: "Origin",
    render: (i) => i.specifications.origin || <EmDash />,
  },
  {
    key: "tags",
    label: "Tags",
    render: (i) =>
      i.tags?.length ? (
        <div className="flex flex-wrap justify-center gap-1">
          {i.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--off-white-2)", color: "var(--charcoal-soft)" }}
            >
              {t}
            </span>
          ))}
        </div>
      ) : (
        <EmDash />
      ),
  },
];

function EmDash() {
  return <Minus className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--charcoal-mist)" }} />;
}

// ── Best value detection ──────────────────────────────────────────────────────
function getBestIdx(def: SpecDef, items: CompareItem[]): number {
  if (!def.compareMode || !def.numericExtract) return -1;
  const nums = items.map(def.numericExtract);
  if (nums.some((n) => n === null)) return -1;
  const vals = nums as number[];
  if (def.compareMode === "lower") return vals.indexOf(Math.min(...vals));
  return vals.indexOf(Math.max(...vals)); // "higher" or "bool"
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { items, remove, clear } = useCompareStore();
  const { addItem }              = useCart();
  const [showAll, setShowAll]    = useState(false);

  const visibleSpecs = showAll ? SPEC_DEFS : SPEC_DEFS.slice(0, 6);

  // Best price index within the *filled* items array.
  // We use slot positions (0-2) so the comparison is stable as items change.
  const filledPrices  = items.map((i) => i.price);
  const bestPriceIdx  = filledPrices.length > 1
    ? filledPrices.indexOf(Math.min(...filledPrices))
    : -1;

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 75% 50%, rgba(200,16,46,0.11) 0%, transparent 55%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto">
          <nav
            className="flex items-center gap-1.5 mb-6 text-[12px]"
            style={{ color: "var(--charcoal-soft)" }}
          >
            <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="w-3 h-3" />Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">Compare</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GitCompare className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[3px]"
                  style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-jetbrains)" }}
                >
                  Side by Side
                </span>
              </div>
              <h1
                className="text-white leading-tight mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  fontWeight: 600,
                }}
              >
                Compare{" "}
                <span style={{ color: "var(--red-light)" }}>Products</span>
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                {items.length === 0
                  ? "Visit any product page and click \"Add to Compare\" to get started."
                  : `Comparing ${items.length} of ${MAX_COMPARE} products.`}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors mt-1"
                style={{
                  background: "rgba(200,16,46,0.12)",
                  color: "var(--red-light)",
                  border: "1px solid rgba(200,16,46,0.2)",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* ── Empty state ──────────────────────────────────────────────── */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "rgba(200,16,46,0.07)" }}
            >
              <GitCompare className="w-7 h-7" style={{ color: "var(--red)" }} />
            </div>
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--charcoal)" }}>
              No products to compare
            </h2>
            <p className="text-sm mb-2" style={{ color: "var(--charcoal-mist)" }}>
              Browse products and click the <strong>Compare</strong> button on any product page.
            </p>
            <p className="text-xs mb-7" style={{ color: "var(--charcoal-mist)" }}>
              You can compare up to {MAX_COMPARE} products side by side.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--red)" }}
            >
              <Package className="w-4 h-4" /> Browse Products
            </Link>
          </div>
        )}

        {/* ── Compare table ─────────────────────────────────────────────── */}
        {items.length > 0 && (
          <>
          {/* Scroll hint — mobile only */}
          <p
            className="md:hidden flex items-center justify-center gap-1.5 mb-2 text-[11px]"
            style={{ color: "var(--charcoal-mist)" }}
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Swipe to compare
            <ChevronRight className="w-3.5 h-3.5" />
          </p>

          <div
            className="overflow-x-auto rounded-2xl"
            style={{
              border: "1px solid var(--border-light)",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/*
              table-fixed + <colgroup> ensures column widths are calculated
              once and never change when products are added/removed.
              Each slot (0–2) always occupies the same column position —
              only its content changes, no DOM remounting, no layout shift.
            */}
            <table className="w-full table-fixed border-collapse" style={{ minWidth: 600 }}>
              <colgroup>
                {/* Label column: narrower on mobile to give product cards more room */}
                <col style={{ width: 120 }} />
                {Array.from({ length: MAX_COMPARE }).map((_, i) => (
                  <col key={i} />
                ))}
              </colgroup>

              {/* ── Product header cards ─────────────────────────────── */}
              <thead>
                <tr>
                  {/* Corner cell — sticky so it stays visible while scrolling */}
                  <th
                    className="p-4 text-left align-bottom"
                    style={{
                      background: "white",
                      borderBottom: "1px solid var(--border-light)",
                      borderRight: "1px solid var(--border-subtle)",
                      position: "sticky",
                      left: 0,
                      zIndex: 3,
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: "var(--charcoal-mist)" }}>
                      {items.length} / {MAX_COMPARE} products
                    </span>
                  </th>

                  {/* Always render MAX_COMPARE columns — key = slot index (stable) */}
                  {Array.from({ length: MAX_COMPARE }).map((_, slotIdx) => {
                    const item = items[slotIdx];

                    if (!item) {
                      return (
                        <th
                          key={slotIdx}
                          className="p-4 align-middle"
                          style={{
                            background: "white",
                            borderBottom: "1px solid var(--border-light)",
                            borderLeft: "1px solid var(--border-light)",
                          }}
                        >
                          <Link
                            href="/products"
                            className="rounded-xl flex flex-col items-center justify-center gap-3 transition-all py-8"
                            style={{ border: "1.5px dashed rgba(30,30,30,0.15)" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--red)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(30,30,30,0.15)")}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(200,16,46,0.07)" }}
                            >
                              <Package className="w-5 h-5" style={{ color: "var(--red)" }} />
                            </div>
                            <div className="text-center px-3">
                              <p className="text-xs font-semibold mb-1" style={{ color: "var(--charcoal-soft)" }}>
                                Add a product
                              </p>
                              <p className="text-[10px]" style={{ color: "var(--charcoal-mist)" }}>
                                Click <strong>Compare</strong> on any product page
                              </p>
                            </div>
                          </Link>
                        </th>
                      );
                    }

                    const discount = item.originalPrice && item.originalPrice > item.price
                      ? Math.round((1 - item.price / item.originalPrice) * 100)
                      : item.discountPercentage ?? 0;
                    const initials = item.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                    const coverImg = item.images?.[0];
                    const isBestPrice = slotIdx === bestPriceIdx;

                    return (
                      <th
                        key={slotIdx}
                        className="p-4 align-top"
                        style={{
                          background: "white",
                          borderBottom: "1px solid var(--border-light)",
                          borderLeft: "1px solid var(--border-light)",
                        }}
                      >
                        <div className="relative">
                          {/* Remove */}
                          <button
                            onClick={() => remove(item.id)}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
                            style={{ background: "rgba(30,30,30,0.07)" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(200,16,46,0.12)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(30,30,30,0.07)")}
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="w-3 h-3" style={{ color: "var(--charcoal-soft)" }} />
                          </button>

                          {/* Image */}
                          <Link href={`/product/${item.id}`}>
                            <div
                              className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center overflow-hidden transition-opacity hover:opacity-90"
                              style={{ background: "var(--off-white-2)" }}
                            >
                              {coverImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={coverImg} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl font-black select-none" style={{ color: "var(--charcoal-mist)" }}>
                                  {initials}
                                </span>
                              )}
                            </div>
                          </Link>

                          {discount > 0 && (
                            <span
                              className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-2"
                              style={{ background: "rgba(200,16,46,0.1)", color: "var(--red)" }}
                            >
                              -{discount}%
                            </span>
                          )}

                          {item.merchantSlug ? (
                            <Link
                              href={`/store/${item.merchantSlug}`}
                              className="block text-[10px] mb-1 hover:underline text-left"
                              style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-jetbrains)" }}
                            >
                              {item.merchantName}
                            </Link>
                          ) : (
                            <p className="text-[10px] mb-1 text-left" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-jetbrains)" }}>
                              {item.merchantName}
                            </p>
                          )}

                          <Link href={`/product/${item.id}`}>
                            <h3 className="font-bold text-[13px] leading-snug mb-2 text-left hover:underline" style={{ color: "var(--charcoal)" }}>
                              {item.name}
                            </h3>
                          </Link>

                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-base font-bold" style={{ color: isBestPrice ? "#15803d" : "var(--charcoal)" }}>
                              {formatPrice(item.price)}
                              {isBestPrice && (
                                <Trophy className="inline w-3 h-3 ml-1" style={{ color: "#ca8a04" }} />
                              )}
                            </span>
                            {discount > 0 && item.originalPrice && (
                              <span className="text-xs line-through" style={{ color: "var(--charcoal-mist)" }}>
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              addItem({
                                offerId:           item.id,
                                productId:         item.id,
                                productName:       item.name,
                                productImage:      item.images?.[0] ?? "",
                                merchantId:        item.merchantId ?? "",
                                merchantStoreName: item.merchantName,
                                merchantSlug:      item.merchantSlug ?? "",
                                price:             item.price,
                                stock:             item.stock.quantity,
                                source:            "MARKETPLACE",
                              })
                            }
                            disabled={!item.stock.inStock}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                            style={{ background: "var(--charcoal)" }}
                            onMouseEnter={(e) => { if (item.stock.inStock) (e.currentTarget as HTMLElement).style.background = "var(--red)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--charcoal)"; }}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {item.stock.inStock ? "Add to Cart" : "Out of Stock"}
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ── Spec rows ─────────────────────────────────────────── */}
              <tbody>
                {visibleSpecs.map((def, rowIdx) => {
                  const bestIdx = getBestIdx(def, items);
                  const rowBg   = rowIdx % 2 === 0 ? "white" : "var(--off-white)";

                  return (
                    <tr key={def.key}>
                      <th
                        scope="row"
                        className="py-3.5 px-4 text-xs font-semibold text-left whitespace-nowrap"
                        style={{
                          color: "var(--charcoal-soft)",
                          background: rowBg,
                          borderRight: "1px solid var(--border-subtle)",
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                        }}
                      >
                        {def.label}
                      </th>
                      {Array.from({ length: MAX_COMPARE }).map((_, slotIdx) => {
                        const item    = items[slotIdx];
                        const isBest  = !!item && bestIdx === slotIdx && items.length > 1;
                        return (
                          <td
                            key={slotIdx}
                            className="py-3.5 px-4 text-center text-sm"
                            style={{
                              background:  isBest ? "rgba(22,163,74,0.05)" : rowBg,
                              borderLeft:  "1px solid var(--border-subtle)",
                              color:       "var(--charcoal)",
                              borderTop:   isBest ? "1px solid rgba(22,163,74,0.2)" : "none",
                            }}
                          >
                            {item ? def.render(item) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Show more / less ─────────────────────────────────────── */}
            <div
              className="flex items-center justify-center py-4"
              style={{ background: "white", borderTop: "1px solid var(--border-subtle)" }}
            >
              <button
                onClick={() => setShowAll((v) => !v)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "var(--off-white-2)",
                  color: "var(--charcoal)",
                  border: "1px solid var(--border-light)",
                }}
              >
                {showAll ? (
                  <><ChevronUp className="w-4 h-4" />Show Less</>
                ) : (
                  <><ChevronDown className="w-4 h-4" />Show All {SPEC_DEFS.length} Specs</>
                )}
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </main>
  );
}
