"use client";

import { Search, CreditCard, MapPin, PackageCheck } from "lucide-react";

const STEPS = [
  {
    id: "01",
    title: "Find Product",
    description:
      "Search through thousands of items, browse categories, and find the best price.",
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: "02",
    title: "Secure Payment",
    description:
      "Pay safely with 256-bit SSL encryption via credit card or bank transfer.",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "03",
    title: "Track Order",
    description:
      "Monitor your order in real-time. See your courier's live location on the map.",
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: "04",
    title: "Fast Delivery",
    description:
      "At your door within 24 hours. Get it today with our Express delivery option.",
    icon: <PackageCheck className="w-5 h-5" />,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      className="py-24"
      style={{
        background: "var(--charcoal)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{ border: "50px solid rgba(200,16,46,0.08)" }}
      />

      <div className="max-w-325 mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                How it works
              </span>
            </div>
            <h2
              className="font-normal leading-[1.1] tracking-[-0.01em] text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
              }}
            >
              Shopping is <em style={{ color: "var(--red)" }}>this simple.</em>
            </h2>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className="group relative p-7 rounded-2xl transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.07)";
                el.style.borderColor = "rgba(200,16,46,0.3)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.04)";
                el.style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              {/* Red accent bottom bar */}
              <div
                className="absolute bottom-0 left-7 right-7 h-[2px] rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: "var(--red)" }}
              />

              <div className="flex justify-between items-start mb-7">
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center"
                  style={{
                    background: "rgba(200,16,46,0.15)",
                    color: "var(--red)",
                  }}
                >
                  {step.icon}
                </div>
                <span
                  className="font-light leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2.5rem",
                    color: "rgba(255,255,255,0.06)",
                  }}
                >
                  {step.id}
                </span>
              </div>

              <h3
                className="font-bold mb-3 text-white"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.0625rem",
                }}
              >
                {step.title}
              </h3>
              <p
                className="text-[0.8125rem] leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {step.description}
              </p>

              {/* Connector arrow for non-last items */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div
                    className="w-6 h-px"
                    style={{ background: "rgba(200,16,46,0.3)" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
