"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Clock } from "lucide-react";

// Flash sale bitiş zamanı — deployment'ta env var'a taşınabilir
const FLASH_SALE_END = (() => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
})();

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      hours: Math.floor(diff / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
      done: diff === 0,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function Digit({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, "0");
  return (
    <div style={{ textAlign: "center", minWidth: 52 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 10,
          padding: "6px 10px",
          fontFamily: "var(--font-display)",
          fontSize: "1.75rem",
          fontWeight: 500,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          minWidth: 52,
          textAlign: "center",
        }}
      >
        {v}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

const DEALS = [
  {
    label: "Electronics",
    discount: "Up to 40% off",
    href: "/deals?cat=elektronik",
  },
  { label: "Fashion", discount: "Up to 55% off", href: "/deals?cat=giyim" },
  {
    label: "Home & Living",
    discount: "Up to 30% off",
    href: "/deals?cat=ev-yasam",
  },
];

export default function FlashSale() {
  const { hours, minutes, seconds, done } = useCountdown(FLASH_SALE_END);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((p) => (p + 1) % DEALS.length),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  if (done) return null;

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, var(--charcoal) 0%, #2a0a12 50%, var(--red-dark) 100%)",
        padding: "0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Decorative noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "1.5rem 2rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left: Label + rotating deal */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--red)",
              borderRadius: 10,
              padding: "8px 14px",
              flexShrink: 0,
            }}
          >
            <Zap size={15} color="#fff" fill="#fff" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#fff",
                fontWeight: 500,
              }}
            >
              Flash Sale
            </span>
          </div>

          <div style={{ overflow: "hidden", position: "relative", height: 24 }}>
            {DEALS.map((d, i) => (
              <div
                key={d.label}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(8px)",
                  pointerEvents: i === active ? "auto" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.65)",
                    letterSpacing: "0.04em",
                  }}
                >
                  — {d.discount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Countdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Clock size={14} color="rgba(255,255,255,0.5)" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.625rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginRight: 4,
            }}
          >
            Ends in
          </span>
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
          >
            <Digit value={hours} label="hrs" />
            <span
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "1.4rem",
                fontFamily: "var(--font-display)",
                lineHeight: "2.1rem",
              }}
            >
              :
            </span>
            <Digit value={minutes} label="min" />
            <span
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "1.4rem",
                fontFamily: "var(--font-display)",
                lineHeight: "2.1rem",
              }}
            >
              :
            </span>
            <Digit value={seconds} label="sec" />
          </div>
        </div>

        {/* Right: CTA */}
        <Link
          href="/deals"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            padding: "0.625rem 1.25rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            transition: "background 0.2s ease",
            flexShrink: 0,
          }}
          className="hover:bg-white/20"
        >
          Shop all deals
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
