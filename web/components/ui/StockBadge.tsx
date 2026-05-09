"use client";

import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

interface StockBadgeProps {
  stock: number;
  className?: string;
}

/**
 * Displays urgency-driven stock indicators:
 *   ≤ 0   → Out of Stock
 *   1–5   → Only N left (red pulse)
 *   6–15  → Almost gone (amber)
 *   16–30 → Selling fast (subtle)
 */
export function StockBadge({ stock, className }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          background: "rgba(100,100,100,0.1)",
          border: "1px solid rgba(100,100,100,0.15)",
          borderRadius: 999,
          padding: "3px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--charcoal-soft)",
        }}
      >
        Out of stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          background: "rgba(200,16,46,0.08)",
          border: "1px solid rgba(200,16,46,0.18)",
          borderRadius: 999,
          padding: "3px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--red)",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--red)",
            animation: "stockPulse 1.2s ease-out infinite",
            flexShrink: 0,
          }}
        />
        Only {stock} left
        <style>{`
          @keyframes stockPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.5); }
          }
        `}</style>
      </span>
    );
  }

  if (stock <= 15) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 999,
          padding: "3px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#d97706",
        }}
      >
        <AlertTriangle size={10} />
        Almost gone
      </span>
    );
  }

  if (stock <= 30) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          background: "rgba(59,130,246,0.07)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 999,
          padding: "3px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#3b82f6",
        }}
      >
        <TrendingUp size={10} />
        Selling fast
      </span>
    );
  }

  return null;
}

/**
 * Compact stock bar — shows a visual progress-style indicator.
 * Use on product detail pages.
 */
export function StockBar({ stock, max = 100 }: { stock: number; max?: number }) {
  const pct = Math.min(100, (stock / max) * 100);
  const critical = pct <= 10;
  const low = pct <= 25;

  const color = critical
    ? "var(--red)"
    : low
    ? "#d97706"
    : "var(--success)";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.375rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--charcoal-soft)",
          }}
        >
          {critical ? "⚡ Critical stock" : low ? "🔥 Low stock" : "✓ In stock"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--charcoal)",
          }}
        >
          {stock} remaining
        </span>
      </div>
      <div
        style={{
          height: 5,
          background: "var(--off-white-2)",
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

/**
 * "X sold in last 24h" badge for high-velocity products
 */
export function HotSeller({ soldCount }: { soldCount: number }) {
  if (soldCount < 10) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        background: "rgba(200,16,46,0.08)",
        border: "1px solid rgba(200,16,46,0.15)",
        borderRadius: 999,
        padding: "3px 10px",
        fontFamily: "var(--font-mono)",
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--red)",
      }}
    >
      <Zap size={10} fill="currentColor" />
      {soldCount}+ sold today
    </span>
  );
}
