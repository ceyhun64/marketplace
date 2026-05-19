"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Store, ShoppingBag, Sparkles } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatItem {
  value: string;
  label: string;
}

interface HeroData {
  badge: string;
  /** Each string is one display line. The last line receives the gradient treatment. */
  headlineLines: string[];
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: StatItem[];
}

// ── Default content ───────────────────────────────────────────────────────────

const DEFAULT_DATA: HeroData = {
  badge: "The Future of Commerce",
  headlineLines: ["Where Brands", "Meet Their", "Customers"],
  subheadline:
    "A multi-vendor marketplace built for modern commerce. Launch your store in minutes, sell everywhere, and grow without limits.",
  primaryCta: { label: "Start Selling Free", href: "/auth/register-merchant" },
  secondaryCta: { label: "Explore Marketplace", href: "/products" },
  stats: [
    { value: "50K+", label: "Active Sellers" },
    { value: "2M+", label: "Products" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "4.9★", label: "Merchant Rating" },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection({ data = DEFAULT_DATA }: { data?: HeroData }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section
      role="banner"
      className="relative overflow-hidden"
      style={{ background: "#0A0A0B", minHeight: "100svh", display: "flex", alignItems: "center" }}
    >
      {/* ── Ambient Background ── */}
      <Background />

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32 lg:py-40">
        <div className="max-w-4xl">

          {/* Badge pill */}
          <Fade ready={ready} delay={80}>
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 sm:mb-8"
              style={{
                background: "rgba(200,16,46,0.09)",
                border: "1px solid rgba(200,16,46,0.22)",
                color: "#FF4D6D",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              {data.badge}
            </span>
          </Fade>

          {/* Headline */}
          <h1 style={{ lineHeight: 0.96, letterSpacing: "-0.03em" }}>
            {data.headlineLines.map((line, i) => {
              const isLast = i === data.headlineLines.length - 1;
              return (
                <Fade key={i} ready={ready} delay={160 + i * 110} asBlock>
                  <span
                    className="block"
                    style={{
                      fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
                      fontSize: "clamp(3rem, 7.5vw, 6.75rem)",
                      fontWeight: 600,
                      ...(isLast
                        ? {
                            backgroundImage:
                              "linear-gradient(130deg, #818CF8 0%, #C084FC 45%, #F472B6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }
                        : { color: "#F0F0F2" }),
                    }}
                  >
                    {line}
                  </span>
                </Fade>
              );
            })}
          </h1>

          {/* Subheadline */}
          <Fade ready={ready} delay={560}>
            <p
              className="mt-6 sm:mt-8 max-w-xl text-base sm:text-lg leading-[1.65]"
              style={{ color: "#5C5C68", fontFamily: "var(--font-body)" }}
            >
              {data.subheadline}
            </p>
          </Fade>

          {/* CTAs */}
          <Fade ready={ready} delay={680}>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
              <PrimaryButton href={data.primaryCta.href} label={data.primaryCta.label} />
              <SecondaryButton href={data.secondaryCta.href} label={data.secondaryCta.label} />
            </div>
          </Fade>

          {/* Stats row */}
          <Fade ready={ready} delay={820}>
            <div className="mt-12 sm:mt-16 flex flex-wrap gap-7 sm:gap-12">
              {data.stats.map((s, i) => (
                <div key={i}>
                  <div
                    className="text-2xl sm:text-3xl font-bold tabular-nums"
                    style={{
                      color: "#E8E8EC",
                      letterSpacing: "-0.025em",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-xs sm:text-[0.8125rem] mt-0.5"
                    style={{ color: "#46464E" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Fade>
        </div>
      </div>

      {/* Bottom fade-out gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #0A0A0B)",
        }}
      />
    </section>
  );
}

// ── Background orbs + grid ─────────────────────────────────────────────────────

function Background() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 45% 35%, black 30%, transparent 100%)",
        }}
      />

      {/* Orb — top-left indigo */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-8%",
          width: "min(55vw, 720px)",
          height: "min(55vw, 720px)",
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 68%)",
          filter: "blur(70px)",
        }}
      />

      {/* Orb — right purple */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          right: "-12%",
          width: "min(45vw, 600px)",
          height: "min(45vw, 600px)",
          background:
            "radial-gradient(ellipse, rgba(192,132,252,0.09) 0%, transparent 68%)",
          filter: "blur(70px)",
        }}
      />

      {/* Orb — bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "25%",
          width: "min(30vw, 400px)",
          height: "min(30vw, 400px)",
          background:
            "radial-gradient(ellipse, rgba(200,16,46,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}

// ── Utility: fade-in-up wrapper ────────────────────────────────────────────────

function Fade({
  children,
  ready,
  delay,
  asBlock = false,
}: {
  children: React.ReactNode;
  ready: boolean;
  delay: number;
  asBlock?: boolean;
}) {
  return (
    <div
      className={asBlock ? "block" : ""}
      style={{
        transition: `opacity 680ms ease, transform 680ms cubic-bezier(0.16,1,0.3,1)`,
        transitionDelay: `${delay}ms`,
        opacity: ready ? 1 : 0,
        transform: ready ? "translateY(0)" : "translateY(18px)",
      }}
    >
      {children}
    </div>
  );
}

// ── CTA Buttons ────────────────────────────────────────────────────────────────

function PrimaryButton({ href, label }: { href: string; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-[0.9375rem] transition-all duration-300 select-none"
      style={{
        background: hov
          ? "linear-gradient(135deg, #E01232 0%, #B00C28 100%)"
          : "linear-gradient(135deg, #C8102E 0%, #9A0C24 100%)",
        color: "#ffffff",
        boxShadow: hov
          ? "0 0 0 1px rgba(200,16,46,0.45), 0 8px 36px rgba(200,16,46,0.38), 0 2px 10px rgba(200,16,46,0.22)"
          : "0 0 0 1px rgba(200,16,46,0.28), 0 4px 18px rgba(200,16,46,0.22)",
        transform: hov ? "translateY(-2px) scale(1.015)" : "translateY(0) scale(1)",
        letterSpacing: "-0.01em",
      }}
    >
      <Store className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
      {label}
      <ArrowRight
        className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
        style={{ transform: hov ? "translateX(4px)" : "translateX(0)" }}
        strokeWidth={2}
      />
    </Link>
  );
}

function SecondaryButton({ href, label }: { href: string; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-[0.9375rem] transition-all duration-300 select-none"
      style={{
        background: hov ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.04)",
        color: hov ? "#D8D8E0" : "#7A7A84",
        border: `1px solid ${hov ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        letterSpacing: "-0.01em",
      }}
    >
      <ShoppingBag className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
      {label}
    </Link>
  );
}
