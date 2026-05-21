"use client";

import Link from "next/link";
import {
  Store,
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const PERKS = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Grow Your Sales",
    desc: "Reach thousands of active shoppers from day one.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Dedicated Support",
    desc: "Our merchant team helps you set up and scale.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Secure Payouts",
    desc: "Reliable, on-time payments straight to your account.",
  },
];

export default function BecomeSellerSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#f7f7f6]">
      {/* Decorative rings */}
      <div
        className="absolute top-[-100px] right-[-80px] w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ border: "60px solid rgba(200,16,46,0.05)" }}
      />
      <div
        className="absolute bottom-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ border: "40px solid rgba(200,16,46,0.04)" }}
      />

      <div className="max-w-325 mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-6 h-px"
                  style={{ background: "var(--red)" }}
                />
                <span
                  className="font-mono text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Sell on our platform
                </span>
              </div>
              <h2
                className="font-normal leading-[1.1] tracking-[-0.01em]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  color: "var(--charcoal)",
                }}
              >
                Turn your passion
                <br />
                into a <em style={{ color: "var(--red)" }}>thriving store.</em>
              </h2>
              <p
                className="text-[0.9375rem] leading-relaxed max-w-md"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Join hundreds of merchants already selling on our marketplace.
                Apply today — our team reviews applications within 1–2 business
                days.
              </p>
            </div>

            <Link
              href="/auth/apply-merchant"
              className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-opacity group"
              style={{ background: "var(--charcoal)", color: "#fff" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--red)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--charcoal)";
              }}
            >
              <Store className="w-4 h-4" />
              Apply Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right — perks */}
          <div className="space-y-4">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="flex items-start gap-5 p-6 rounded-2xl bg-white transition-all duration-300"
                style={{ border: "1px solid rgba(0,0,0,0.05)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(200,16,46,0.2)";
                  el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(0,0,0,0.05)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-11 h-11 rounded-[10px] flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    background: "rgba(200,16,46,0.08)",
                    color: "var(--red)",
                  }}
                >
                  {perk.icon}
                </div>
                <div>
                  <h3
                    className="font-bold mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "1rem",
                      color: "var(--charcoal)",
                    }}
                  >
                    {perk.title}
                  </h3>
                  <p
                    className="text-[0.8125rem] leading-relaxed"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    {perk.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
