"use client";

import { useState } from "react";
import {
  Zap,
  Globe,
  ShieldCheck,
  BarChart3,
  Package,
  Truck,
  type LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Bento grid span — controls colspan/rowspan */
  size: "sm" | "md" | "lg";
  accentColor?: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "Instant Storefront",
    description:
      "Go live in minutes. Custom domain, branding, and product catalogue — all in one onboarding flow.",
    size: "lg",
    accentColor: "#818CF8",
  },
  {
    icon: Globe,
    title: "Multi-Channel Selling",
    description:
      "Sell on the marketplace and your own branded eStore simultaneously with unified inventory.",
    size: "md",
    accentColor: "#34D399",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Stripe-powered escrow with automatic settlement after delivery confirmation.",
    size: "md",
    accentColor: "#FBBF24",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Revenue breakdown by channel, top-performing products, and courier performance — live.",
    size: "sm",
    accentColor: "#C084FC",
  },
  {
    icon: Package,
    title: "Smart Inventory",
    description:
      "Variant matrices with per-SKU stock and pricing, plus low-stock alerts.",
    size: "sm",
    accentColor: "#F472B6",
  },
  {
    icon: Truck,
    title: "Geo Dispatch",
    description:
      "Auto-assigns the nearest available courier using Haversine distance scoring.",
    size: "md",
    accentColor: "#22D3EE",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeaturesGrid() {
  return (
    <section
      style={{ background: "#0A0A0B", paddingBlock: "96px 104px" }}
      className="relative overflow-hidden"
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 mb-14 sm:mb-16">
        <p
          className="text-xs font-semibold tracking-[0.16em] uppercase mb-3"
          style={{ color: "#C8102E" }}
        >
          Platform Features
        </p>
        <h2
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
            fontSize: "clamp(2rem, 4.5vw, 3.75rem)",
            fontWeight: 600,
            color: "#E8E8EC",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            maxWidth: "600px",
          }}
        >
          Everything you need to{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(130deg, #818CF8 0%, #C084FC 60%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            scale
          </span>
        </h2>
      </div>

      {/* Bento grid */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: Feature }) {
  const [hov, setHov] = useState(false);
  const { icon: Icon, title, description, size, accentColor = "#818CF8" } = feature;

  const isLarge = size === "lg";
  const padding = isLarge ? "p-8 sm:p-10" : "p-7";

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`relative rounded-2xl overflow-hidden transition-all duration-400 cursor-default ${
        isLarge ? "sm:col-span-2 lg:col-span-1 lg:row-span-1" : ""
      }`}
      style={{
        background: hov ? "#16161A" : "#111114",
        border: `1px solid ${
          hov
            ? `rgba(${hexToRgb(accentColor)}, 0.28)`
            : "rgba(255,255,255,0.065)"
        }`,
        boxShadow: hov
          ? `0 0 0 1px rgba(${hexToRgb(accentColor)}, 0.14), 0 12px 40px rgba(0,0,0,0.45)`
          : "none",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Glow shimmer behind icon on hover */}
      <div
        className="absolute top-0 left-0 w-40 h-40 pointer-events-none transition-opacity duration-400"
        style={{
          background: `radial-gradient(circle, rgba(${hexToRgb(accentColor)}, 0.12) 0%, transparent 70%)`,
          transform: "translate(-30%, -30%)",
          opacity: hov ? 1 : 0,
        }}
      />

      <div className={`relative ${padding}`}>
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
          style={{
            background: hov
              ? `rgba(${hexToRgb(accentColor)}, 0.16)`
              : `rgba(${hexToRgb(accentColor)}, 0.09)`,
            border: `1px solid rgba(${hexToRgb(accentColor)}, ${hov ? 0.28 : 0.14})`,
          }}
        >
          <Icon
            className="w-5 h-5 transition-all duration-300"
            style={{
              color: accentColor,
              filter: hov ? `drop-shadow(0 0 6px rgba(${hexToRgb(accentColor)}, 0.7))` : "none",
            }}
            strokeWidth={1.75}
          />
        </div>

        {/* Title */}
        <h3
          className="font-semibold mb-2.5 transition-colors duration-300"
          style={{
            color: hov ? "#F0F0F2" : "#C8C8CE",
            fontSize: "1.0625rem",
            letterSpacing: "-0.015em",
            fontFamily: "var(--font-body)",
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-[1.65]"
          style={{ color: "#4A4A52", fontFamily: "var(--font-body)" }}
        >
          {description}
        </p>
      </div>
    </article>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
