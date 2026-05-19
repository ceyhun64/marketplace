"use client";

import { useState } from "react";
import { Star, Quote } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  /** 2-letter initials for avatar fallback */
  initials: string;
  accentColor: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "We migrated from three separate tools to this platform in a week. Revenue is up 34% and our operations team finally has a single source of truth.",
    author: "Sarah Chen",
    role: "Head of E-Commerce",
    company: "NovaTrade",
    rating: 5,
    initials: "SC",
    accentColor: "#818CF8",
  },
  {
    id: "t2",
    quote:
      "The geo-dispatch system is a game-changer. Delivery times dropped by 40% in our first month. The courier portal is the only thing our drivers use now.",
    author: "Marcus Webb",
    role: "Operations Director",
    company: "Steelhaus Logistics",
    rating: 5,
    initials: "MW",
    accentColor: "#34D399",
  },
  {
    id: "t3",
    quote:
      "Real-time SignalR tracking gave our customers a boutique experience. Refund requests dropped 60% since they can follow every step of delivery.",
    author: "Léa Fontaine",
    role: "Founder",
    company: "Velora Studio",
    rating: 5,
    initials: "LF",
    accentColor: "#F472B6",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TestimonialsSection() {
  return (
    <section
      style={{ background: "#080809", paddingBlock: "96px 112px" }}
      className="relative overflow-hidden"
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-14 sm:mb-16">
          <p
            className="text-xs font-semibold tracking-[0.16em] uppercase mb-3"
            style={{ color: "#C8102E" }}
          >
            Social Proof
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
              fontSize: "clamp(2rem, 4.5vw, 3.75rem)",
              fontWeight: 600,
              color: "#E8E8EC",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              maxWidth: "540px",
            }}
          >
            Loved by builders{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(130deg, #C8102E 0%, #FF4D6D 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              worldwide
            </span>
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>

        {/* Aggregate stat */}
        <div className="mt-14 sm:mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex -space-x-2">
            {TESTIMONIALS.map((t) => (
              <AvatarChip key={t.id} initials={t.initials} color={t.accentColor} />
            ))}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[0.625rem] font-semibold z-10"
              style={{
                background: "#1C1C20",
                border: "2px solid #080809",
                color: "#5A5A64",
              }}
            >
              +2K
            </div>
          </div>
          <p
            className="text-sm leading-snug"
            style={{ color: "#4A4A52", maxWidth: "340px" }}
          >
            Join{" "}
            <span style={{ color: "#9090A0" }}>2,400+ merchants</span> who
            have already scaled their business on the platform.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Testimonial Card ──────────────────────────────────────────────────────────

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [hov, setHov] = useState(false);
  const { quote, author, role, company, rating, initials, accentColor } = testimonial;
  const rgb = hexToRgb(accentColor);

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative rounded-2xl p-7 transition-all duration-350 cursor-default"
      style={{
        background: hov ? "#141418" : "#0F0F12",
        border: `1px solid ${
          hov ? `rgba(${rgb}, 0.22)` : "rgba(255,255,255,0.06)"
        }`,
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(${rgb}, 0.1)`
          : "none",
      }}
    >
      {/* Quote icon */}
      <Quote
        className="w-5 h-5 mb-5 transition-colors duration-300"
        style={{ color: hov ? accentColor : "#2A2A30" }}
        strokeWidth={1.5}
      />

      {/* Stars */}
      <div className="flex gap-0.5 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-3.5 h-3.5"
            style={{
              color: i < rating ? "#FBBF24" : "#2A2A30",
              fill: i < rating ? "#FBBF24" : "none",
            }}
            strokeWidth={1.5}
          />
        ))}
      </div>

      {/* Quote text */}
      <blockquote
        className="text-sm sm:text-[0.9375rem] leading-[1.7] mb-7"
        style={{ color: "#5E5E6A", fontFamily: "var(--font-body)" }}
      >
        "{quote}"
      </blockquote>

      {/* Divider */}
      <div
        className="mb-5 transition-colors duration-300"
        style={{
          height: "1px",
          background: hov
            ? `rgba(${rgb}, 0.16)`
            : "rgba(255,255,255,0.05)",
        }}
      />

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: `rgba(${rgb}, 0.14)`,
            color: accentColor,
            border: `1px solid rgba(${rgb}, 0.2)`,
          }}
        >
          {initials}
        </div>
        <div>
          <p
            className="text-sm font-semibold leading-none mb-1"
            style={{ color: "#C0C0C8" }}
          >
            {author}
          </p>
          <p className="text-xs leading-none" style={{ color: "#3E3E48" }}>
            {role} · {company}
          </p>
        </div>
      </div>
    </article>
  );
}

// ── Avatar chip ───────────────────────────────────────────────────────────────

function AvatarChip({ initials, color }: { initials: string; color: string }) {
  const rgb = hexToRgb(color);
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10"
      style={{
        background: `rgba(${rgb}, 0.16)`,
        border: "2px solid #080809",
        color,
      }}
    >
      {initials}
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
