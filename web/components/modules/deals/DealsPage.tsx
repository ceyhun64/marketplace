"use client";

import Link from "next/link";
import {
  Zap,
  ChevronRight,
  Home,
  ShoppingCart,
} from "lucide-react";
import { DealsFilteredGrid } from "@/components/modules/deals/DealsFilteredGrid";

// -- Page ----------------------------------------------------------------------
export default function DealsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* -- Hero ----------------------------------------------------------- */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 75% 40%, rgba(200,16,46,0.18) 0%, transparent 55%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 mb-6 text-[12px]"
            style={{ color: "var(--charcoal-soft)" }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home className="w-3 h-3" />
              Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">Deals</span>
          </nav>

          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[3px]"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-jetbrains)",
              }}
            >
              Best Offers
            </span>
          </div>

          <h1
            className="leading-tight mb-2 text-white"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 600,
            }}
          >
            Today&apos;s{" "}
            <span style={{ color: "var(--red-light)" }}>Deals</span>
          </h1>
          <p
            className="text-[15px] mb-6"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Hand-picked offers from our top sellers. Don&apos;t miss out.
          </p>

          <div
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(200,16,46,0.12)",
              color: "var(--red-light)",
              border: "1px solid rgba(200,16,46,0.2)",
            }}
          >
            <ShoppingCart className="w-3 h-3" />
            Free shipping over $500
          </div>
        </div>
      </div>

      {/* -- Filtered grid -------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <DealsFilteredGrid />
      </div>
    </main>
  );
}
