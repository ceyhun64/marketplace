"use client";

import Link from "next/link";
import {
  Users,
  Store,
  Package,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Heart,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const STATS = [
  { value: "50K+", label: "Active Buyers", icon: Users },
  { value: "1,200+", label: "Verified Merchants", icon: Store },
  { value: "180K+", label: "Products Listed", icon: Package },
  { value: "98.4%", label: "Satisfaction Rate", icon: Heart },
];

const VALUES = [
  {
    icon: Shield,
    title: "Trust First",
    desc: "Every merchant is vetted. Every transaction is protected. We never compromise on safety.",
  },
  {
    icon: Zap,
    title: "Speed & Simplicity",
    desc: "From discovery to doorstep — we obsess over removing friction at every step.",
  },
  {
    icon: Globe,
    title: "Open to All",
    desc: "Small artisan or large wholesaler, every seller deserves a professional storefront.",
  },
  {
    icon: TrendingUp,
    title: "Growth Minded",
    desc: "Our tools, analytics, and support are built to help merchants scale — not just survive.",
  },
];

const TIMELINE = [
  { year: "2021", title: "Founded", desc: "Two developers and a whiteboard. The idea: a marketplace that actually works for sellers." },
  { year: "2022", title: "First 100 Merchants", desc: "Bootstrapped to our first milestone. Word-of-mouth growth, zero marketing spend." },
  { year: "2023", title: "Logistics Integration", desc: "Built our own fulfillment layer — real-time tracking, courier assignment, label generation." },
  { year: "2024", title: "Platform Launch", desc: "Public launch with subscription tiers, plugin ecosystem, and analytics dashboard." },
  { year: "2025", title: "1,000+ Merchants", desc: "Crossed the milestone. Expanded categories, launched B2B tools, and opened the API." },
  { year: "2026", title: "Today", desc: "50K+ buyers, 180K+ products, and a team of 30 still moving like a startup." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-20 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,16,46,0.12) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-1 h-4" style={{ background: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Our Story
            </span>
          </div>
          <h1
            className="text-[48px] lg:text-[72px] leading-[1.05] text-white mb-6 max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built for Sellers.{" "}
            <span style={{ color: "var(--red)" }}>Loved by Buyers.</span>
          </h1>
          <p
            className="text-lg max-w-xl leading-relaxed mb-10"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            We started as frustrated online shoppers who couldn't find a
            marketplace that treated independent sellers fairly. So we built one.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/apply-merchant"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: "var(--red)", fontFamily: "var(--font-body)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--red-dark)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--red)")
              }
            >
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-body)",
              }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        className="border-b"
        style={{
          background: "var(--off-white-2)",
          borderColor: "rgba(51,51,51,0.07)",
        }}
      >
        <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3"
                style={{ background: "rgba(200,16,46,0.08)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--red)" }} />
              </div>
              <div
                className="text-[2rem] font-bold leading-none mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--charcoal)",
                }}
              >
                {value}
              </div>
              <div
                className="text-sm"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-16 space-y-20">
        {/* Mission */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Mission
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight mb-5"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Democratising Commerce, One Store at a Time
            </h2>
            <p
              className="text-base leading-relaxed mb-5"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              The internet promised equal footing for small businesses. The
              reality was dominated by gatekeepers with high fees, opaque
              algorithms, and no support. We exist to change that.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              Our platform gives every seller — from a home baker to a fashion
              brand — the same professional tools that enterprise players use,
              at a fraction of the cost.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Zero listing fees — pay only when you sell",
              "Real-time analytics and inventory management",
              "Integrated logistics with live tracking",
              "A plugin ecosystem built for growth",
              "Dedicated merchant support team",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--red)" }}
                />
                <span
                  className="text-[0.9375rem]"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 justify-center">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Our Values
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              What We Stand For
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white"
                style={{
                  border: "1px solid rgba(51,51,51,0.07)",
                  boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                  style={{ background: "rgba(200,16,46,0.07)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--red)" }} />
                </div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 justify-center">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                History
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Our Journey
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute left-[92px] top-0 bottom-0 w-px hidden lg:block"
              style={{ background: "rgba(51,51,51,0.1)" }}
            />
            <div className="space-y-8">
              {TIMELINE.map(({ year, title, desc }, i) => (
                <div key={year} className="flex gap-8 items-start">
                  <div className="flex-shrink-0 w-[72px] text-right">
                    <span
                      className="font-mono text-sm font-bold"
                      style={{
                        color: i === TIMELINE.length - 1 ? "var(--red)" : "var(--charcoal-mist)",
                      }}
                    >
                      {year}
                    </span>
                  </div>
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 hidden lg:block"
                    style={{
                      borderColor: i === TIMELINE.length - 1 ? "var(--red)" : "rgba(51,51,51,0.2)",
                      background: i === TIMELINE.length - 1 ? "var(--red)" : "white",
                    }}
                  />
                  <div
                    className="flex-1 pb-8"
                    style={{
                      borderBottom: i < TIMELINE.length - 1 ? "1px solid rgba(51,51,51,0.06)" : "none",
                    }}
                  >
                    <h3
                      className="font-bold text-base mb-1"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--charcoal)" }}
        >
          <h2
            className="text-[36px] text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to Join Us?
          </h2>
          <p
            className="mb-8 max-w-md mx-auto text-sm"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            Whether you're a buyer looking for great deals or a seller ready to
            grow — there's a place for you here.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: "var(--red)", fontFamily: "var(--font-body)" }}
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/apply-merchant"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-body)",
              }}
            >
              Become a Seller
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
