"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  ChevronRight,
  Flame,
  Tag,
  Home,
  ChevronDown,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { useCart } from "@/hooks/use-cart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types/entities";

// -- Deterministic discount % per product -------------------------------------
function getDiscount(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return 10 + (Math.abs(h) % 41); // 10 – 50 %
}

// -- Data ----------------------------------------------------------------------
function useFlashSaleProducts() {
  return useQuery({
    queryKey: ["products", "flash-sale"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        "/api/products/featured?limit=48&sort=discount",
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// -- Countdown hook ------------------------------------------------------------
function useCountdown(end: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, end.getTime() - Date.now());
    return {
      hours:   Math.floor(diff / 1000 / 60 / 60),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [end]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

// -- Animated digit ------------------------------------------------------------
function Digit({ value }: { value: number }) {
  const [prev, setPrev]     = useState(value);
  const [flash, setFlash]   = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setPrev(value);
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <span
      className="tabular-nums font-bold leading-none transition-all duration-150"
      style={{
        display: "inline-block",
        transform: flash ? "scale(1.18)" : "scale(1)",
        color: flash ? "#ff3355" : "white",
        fontSize: "clamp(1.5rem, 3vw, 2rem)",
        letterSpacing: "-0.03em",
      }}
    >
      {String(value).padStart(2, "0")}
    </span>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="rounded-xl flex items-center justify-center min-w-14 h-14"
        style={{
          background: "rgba(200,16,46,0.15)",
          border: "1.5px solid rgba(200,16,46,0.35)",
        }}
      >
        <Digit value={value} />
      </div>
      <span
        className="text-[9px] uppercase tracking-[2px] font-bold"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {label}
      </span>
    </div>
  );
}

// -- Stock bar -----------------------------------------------------------------
function StockBar({ stock, maxStock = 50 }: { stock?: number; maxStock?: number }) {
  if (stock === undefined) return null;
  const pct   = Math.min(100, Math.round((stock / maxStock) * 100));
  const color = pct <= 20 ? "#c8102e" : pct <= 50 ? "#d97706" : "#16a34a";
  const label =
    stock <= 0    ? "Sold Out"
    : stock <= 5  ? `Only ${stock} left!`
    : `${stock} in stock`;

  return (
    <div className="px-3.5 pb-3.5 pt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color, fontFamily: "var(--font-jetbrains)" }}
        >
          {label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--charcoal-mist)" }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(30,30,30,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// -- Flash card ----------------------------------------------------------------
function FlashCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const discount  = getDiscount(product.id);
  const isHot     = product.stock !== undefined && product.stock > 0 && product.stock <= 8;

  return (
    <div
      className="relative flex flex-col overflow-hidden bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group/fc"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Discount badge */}
      <div
        className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 pointer-events-none"
      >
        <span
          className="text-[11px] font-black px-2 py-0.5 rounded-md tracking-wide"
          style={{ background: "#c8102e", color: "white" }}
        >
          -{discount}%
        </span>
        {isHot && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5"
            style={{ background: "#d97706", color: "white" }}
          >
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
        )}
      </div>

      <ProductCard
        product={product}
        context="marketplace"
        onAddToCart={onAddToCart}
        className="shadow-none border-0 hover:shadow-none hover:translate-y-0 flex-1"
      />
      <StockBar stock={product.stock} />
    </div>
  );
}

// -- Scrolling ticker ----------------------------------------------------------
const TICKER_MSG =
  "⚡ FLASH SALE IS LIVE — Up to 50% off on selected products — " +
  "Limited stock — Free shipping over $500 — Don't miss out — ";

function Ticker() {
  return (
    <div
      className="overflow-hidden whitespace-nowrap select-none"
      style={{ background: "#c8102e", height: 34 }}
    >
      <style>{`
        @keyframes fs-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .fs-ticker-inner {
          display: inline-block;
          animation: fs-ticker 28s linear infinite;
        }
        @keyframes fs-pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .fs-live-dot { animation: fs-pulse-dot 1.2s ease-in-out infinite; }
        @keyframes fs-ring-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(200,16,46,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(200,16,46,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,16,46,0); }
        }
        .fs-countdown-pulse { animation: fs-ring-pulse 2s ease-out infinite; }
      `}</style>
      <span className="fs-ticker-inner text-white text-xs font-semibold tracking-wide leading-[34px]">
        {TICKER_MSG.repeat(6)}
      </span>
    </div>
  );
}

// -- Sort options --------------------------------------------------------------
type SortKey = "discount" | "lowstock" | "price_asc";

const SORT_PILLS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: "discount",  label: "Biggest Discount", icon: <Tag           className="w-3.5 h-3.5" /> },
  { key: "lowstock",  label: "Almost Gone",       icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: "price_asc", label: "Lowest Price",      icon: <Flame         className="w-3.5 h-3.5" /> },
];

// -- Page ----------------------------------------------------------------------
export default function FlashSalePage() {
  const { data: products, isLoading, isError } = useFlashSaleProducts();
  const { addItem } = useCart();

  const [saleEnd] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const [sort, setSort] = useState<SortKey>("discount");
  const countdown = useCountdown(saleEnd);

  const totalSeconds =
    countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
  const isUrgent = totalSeconds < 3600; // under 1 hour

  const sorted = useMemo(
    () =>
      [...(products ?? [])].sort((a, b) => {
        if (sort === "lowstock")  return (a.stock ?? 999) - (b.stock ?? 999);
        if (sort === "price_asc") return a.price - b.price;
        return 0;
      }),
    [products, sort],
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* -- Ticker --------------------------------------------------------- */}
      <Ticker />

      {/* -- Hero ----------------------------------------------------------- */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{
          background:
            "radial-gradient(ellipse at 60% 0%, #3d0011 0%, #1a0008 40%, #0f0f0f 100%)",
        }}
      >
        {/* Sweep glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 60%, rgba(200,16,46,0.22) 0%, transparent 55%)",
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 mb-6 text-[12px]"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="w-3 h-3" />Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">Flash Sale</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end gap-8 justify-between">
            {/* Left */}
            <div>
              {/* LIVE badge */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(200,16,46,0.25)", color: "#ff4466", border: "1px solid rgba(200,16,46,0.4)" }}
                >
                  <span
                    className="fs-live-dot w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: "#ff4466" }}
                  />
                  Live
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-jetbrains)" }}
                >
                  Limited Time Offer
                </span>
              </div>

              <h1
                className="text-white leading-none mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(3rem, 7vw, 5rem)",
                  fontWeight: 700,
                  textShadow: "0 0 60px rgba(200,16,46,0.5)",
                }}
              >
                Flash{" "}
                <span
                  style={{
                    color: "#ff3355",
                    textShadow: "0 0 40px rgba(255,51,85,0.6)",
                  }}
                >
                  Sale
                </span>
              </h1>

              <p
                className="text-[15px] max-w-sm mb-0"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Up to{" "}
                <span className="font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  50% off
                </span>{" "}
                on selected products. Stock is limited.
              </p>
            </div>

            {/* Right: countdown */}
            <div className="shrink-0">
              <div
                className="flex items-center gap-1.5 mb-3"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span
                  className="text-[11px] uppercase tracking-[2px] font-bold"
                  style={{ color: isUrgent ? "#ff4466" : "rgba(255,255,255,0.35)" }}
                >
                  {isUrgent ? "⚡ Ending soon!" : "Sale ends in"}
                </span>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-2xl"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <CountdownUnit value={countdown.hours}   label="Hrs" />
                <span className="text-xl font-bold pb-5 select-none" style={{ color: "rgba(200,16,46,0.6)" }}>:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="text-xl font-bold pb-5 select-none" style={{ color: "rgba(200,16,46,0.6)" }}>:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-2 flex-wrap mt-8">
            {SORT_PILLS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150"
                style={
                  sort === opt.key
                    ? { background: "#c8102e", color: "#fff" }
                    : {
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }
                }
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- Controls bar --------------------------------------------------- */}
      <div
        className="bg-white sticky top-0 z-10 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <span>
                  <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
                    {sorted.length.toLocaleString()}
                  </span>{" "}
                  {sorted.length === 1 ? "product" : "products"} on sale
                </span>
              )}
            </div>

            {/* Live urgency pill */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(200,16,46,0.08)", color: "#c8102e" }}
            >
              <Zap className="w-3 h-3" />
              {countdown.hours}h {String(countdown.minutes).padStart(2, "0")}m left
            </div>

            <div
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(30,30,30,0.05)", color: "var(--charcoal-soft)" }}
            >
              <ShoppingCart className="w-3 h-3" />
              Free shipping over $500
            </div>
          </div>

          {/* Sort select — desktop */}
          <div className="hidden md:block">
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-auto text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_PILLS.map((o) => (
                  <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* -- Content -------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Error */}
        {isError && (
          <div className="text-center py-20">
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
            >
              Could not load products. Please try again.
            </div>
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-black/6">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(200,16,46,0.07)" }}
            >
              <Zap className="w-6 h-6" style={{ color: "var(--red)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--charcoal)" }}>
              No active flash sale right now
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--charcoal-mist)" }}>
              New campaigns are coming soon — check back later!
            </p>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
            >
              Browse all deals <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && sorted.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sorted.map((product) => (
              <FlashCard
                key={product.id}
                product={product}
                onAddToCart={() =>
                  addItem({
                    offerId:           product.id,
                    productId:         product.id,
                    productName:       product.name,
                    productImage:      product.images?.[0] ?? "",
                    merchantId:        product.merchantId,
                    merchantStoreName: product.merchantStoreName,
                    merchantSlug:      product.merchantSlug,
                    price:             product.price,
                    stock:             product.stock,
                    source:            "MARKETPLACE",
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
