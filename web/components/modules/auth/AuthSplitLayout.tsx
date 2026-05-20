"use client";

/**
 * AuthSplitLayout
 * ────────────────
 * Shared viewport-height split container used by Login and Register pages.
 *
 * Left  (55 %)  – white form pane with the auth form slot
 * Right (45 %)  – dark charcoal marketing pane with brand copy
 *                 hidden on mobile (stacks to full-width form only)
 */

import Link from "next/link";
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  Star,
  ChevronRight,
  Store,
  Package,
  Users,
} from "lucide-react";

// ── Right-pane content varies by page ────────────────────────────────────────

const PANE_CONTENT = {
  login: {
    headline: "The marketplace that moves at your speed.",
    sub:      "Sign back in and pick up right where you left off — your cart, wishlist, and orders are all waiting.",
    features: [
      { icon: Zap,         text: "Same-day dispatch on 10 000+ items"  },
      { icon: ShieldCheck, text: "Secure, encrypted checkout — always"  },
      { icon: Truck,       text: "Real-time delivery tracking via GPS"  },
    ],
    testimonial: {
      quote:  "I've ordered from 12 different sellers in a month. Every package arrived on time.",
      author: "Ayşe K.",
      role:   "Premium Member",
    },
    cta: { label: "Explore without signing in", href: "/products" },
  },
  register: {
    headline: "Join 50 000+ merchants and shoppers.",
    sub:      "Create your free account in under 60 seconds and start exploring thousands of verified sellers.",
    features: [
      { icon: Store,   text: "Open your own store in minutes"         },
      { icon: Package, text: "Sell on our marketplace or your eStore" },
      { icon: Users,   text: "50 000+ active sellers already onboard" },
    ],
    testimonial: {
      quote:  "I launched my store on a Sunday afternoon and made my first sale by Monday morning.",
      author: "Mert B.",
      role:   "Merchant · Electronics",
    },
    cta: { label: "Browse as a guest", href: "/products" },
  },
} as const;

// ── Stats row ─────────────────────────────────────────────────────────────────

const STATS = [
  { value: "50K+",  label: "Sellers"   },
  { value: "2M+",   label: "Products"  },
  { value: "4.9★",  label: "Avg. rating" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface AuthSplitLayoutProps {
  children:  React.ReactNode;
  variant:   "login" | "register";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AuthSplitLayout({ children, variant }: AuthSplitLayoutProps) {
  const pane = PANE_CONTENT[variant];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--off-white)" }}>

      {/* ── Left: form pane ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top bar */}
        <div className="shrink-0 px-6 sm:px-10 pt-8 pb-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{ background: "var(--red)", boxShadow: "0 2px 8px rgba(200,16,46,0.25)" }}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize:   "1.125rem",
                fontWeight: 500,
                color:      "var(--charcoal)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              BAZR
            </span>
          </Link>

          {variant === "login" ? (
            <p className="text-sm" style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
              No account?{" "}
              <Link
                href="/auth/register"
                className="font-bold transition-colors hover:text-(--red)"
                style={{ color: "var(--charcoal)" }}
              >
                Register
              </Link>
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
              Have an account?{" "}
              <Link
                href="/auth/login"
                className="font-bold transition-colors hover:text-(--red)"
                style={{ color: "var(--charcoal)" }}
              >
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Form slot — centred vertically */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Footer trust line */}
        <div className="shrink-0 px-6 pb-6 text-center">
          <p
            className="text-[10px] font-mono uppercase tracking-[2.5px]"
            style={{ color: "var(--charcoal-mist)", opacity: 0.5 }}
          >
            256-bit SSL encryption · GDPR compliant · No spam, ever
          </p>
        </div>
      </div>

      {/* ── Right: dark marketing pane — hidden below lg ── */}
      <aside
        className="hidden lg:flex w-[42%] xl:w-[40%] shrink-0 flex-col justify-between relative overflow-hidden"
        style={{ background: "var(--charcoal)" }}
        aria-hidden
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Red glow blob top-right */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(200,16,46,0.18) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        {/* Subtle glow bottom-left */}
        <div
          className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)", filter: "blur(40px)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">

          {/* Headline block */}
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] mb-8"
              style={{
                background: "rgba(200,16,46,0.12)",
                border:     "1px solid rgba(200,16,46,0.2)",
                color:      "#ff6b88",
                fontFamily: "var(--font-mono)",
              }}
            >
              <Star className="w-2.5 h-2.5" fill="currentColor" />
              Premium Marketplace
            </span>

            <h2
              className="leading-[1.08] mb-6"
              style={{
                fontFamily:    "var(--font-display)",
                fontSize:      "clamp(1.875rem, 2.8vw, 2.5rem)",
                fontWeight:    400,
                color:         "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {pane.headline}
            </h2>

            <p
              className="leading-[1.7] mb-10"
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   "0.9375rem",
                color:      "rgba(255,255,255,0.45)",
                maxWidth:   "380px",
              }}
            >
              {pane.sub}
            </p>

            {/* Feature list */}
            <ul className="space-y-4 mb-12">
              {pane.features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                  </div>
                  <span
                    className="text-[0.875rem] leading-snug pt-1.5"
                    style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)" }}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats + Testimonial bottom block */}
          <div className="space-y-5">
            {/* Stats row */}
            <div
              className="grid grid-cols-3 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center py-4 gap-0.5"
                  style={{
                    borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{ color: "#fff", fontFamily: "var(--font-body)", letterSpacing: "-0.03em" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Testimonial card */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border:     "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3" fill="#f59e0b" stroke="none" />
                ))}
              </div>
              <p
                className="text-[0.875rem] leading-relaxed mb-4 italic"
                style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)" }}
              >
                &ldquo;{pane.testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {pane.testimonial.author}
                  </p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>
                    {pane.testimonial.role}
                  </p>
                </div>
                <Link
                  href={pane.cta.href}
                  className="flex items-center gap-1 text-[11px] font-bold transition-opacity hover:opacity-70"
                  style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}
                >
                  {pane.cta.label}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
