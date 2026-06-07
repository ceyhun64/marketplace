"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Clock } from "lucide-react";
import { useRootCategories } from "@/queries/useCategories";

// Flash sale bitiş zamanı — deployment'ta env var'a taşınabilir
function getFlashSaleEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

type Countdown = {
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function useCountdown(): Countdown {
  const [time, setTime] = useState<Countdown | null>(null);

  useEffect(() => {
    const target = getFlashSaleEnd();
    const calc = (): Countdown => {
      const diff = Math.max(0, target.getTime() - Date.now());
      return {
        hours: Math.floor(diff / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
        done: diff === 0,
      };
    };
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  }, []);

  return time ?? { hours: 0, minutes: 0, seconds: 0, done: false };
}

function Digit({
  value,
  label,
  small = false,
}: {
  value: number;
  label: string;
  small?: boolean;
}) {
  const v = String(value).padStart(2, "0");
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: small ? 6 : 10,
          padding: small ? "4px 7px" : "6px 10px",
          fontFamily: "var(--font-display)",
          fontSize: small ? "1rem" : "1.75rem",
          fontWeight: 500,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          minWidth: small ? 30 : 52,
          textAlign: "center",
        }}
      >
        {v}
      </div>
      {!small && (
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
      )}
    </div>
  );
}


const STATIC_DISCOUNTS = ["Up to 40% off", "Up to 55% off", "Up to 30% off", "Up to 35% off", "Up to 45% off"];

export default function FlashSale() {
  const { hours, minutes, seconds, done } = useCountdown();
  const [active, setActive] = useState(0);
  const { data: rootCategories } = useRootCategories();

  const deals = (rootCategories ?? []).slice(0, 5).map((cat, i) => ({
    label: cat.name,
    discount: STATIC_DISCOUNTS[i % STATIC_DISCOUNTS.length],
    href: `/deals?cat=${cat.slug}`,
  }));

  const dealCount = deals.length || 1;

  useEffect(() => {
    const id = setInterval(
      () => setActive((p) => (p + 1) % dealCount),
      3500,
    );
    return () => clearInterval(id);
  }, [dealCount]);

  if (done) return (
    <section
      style={{
        background: "linear-gradient(135deg, var(--charcoal) 0%, #1a1a1a 100%)",
        padding: "0",
        overflow: "hidden",
        position: "relative",
        opacity: 0.7,
      }}
    >
      <div className="max-w-325 mx-auto px-3 sm:px-8 py-2.5 sm:py-4 flex items-center justify-center gap-3 relative z-10">
        <Zap size={13} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 500,
          }}
        >
          Flash Sale Ended
        </span>
      </div>
    </section>
  );

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

      {/* Daima yatay (flex-row). Mobilde kompakt, masaüstünde tam boyut. */}
      <div className="max-w-325 mx-auto px-3 sm:px-8 py-2.5 sm:py-5 lg:py-6 flex items-center justify-between gap-2 sm:gap-6 relative z-10">

        {/* SOL — Flash Sale badge + dönen deal metni */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Badge: mobilde sadece ikon, sm'den itibaren yazı da görünür */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              background: "var(--red)",
              borderRadius: 8,
              padding: "6px 10px",
              flexShrink: 0,
            }}
          >
            <Zap size={13} color="#fff" fill="#fff" />
            <span
              className="hidden sm:inline"
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

          {/* Deal metni — animasyonlu, taşmaz */}
          <div className="relative overflow-hidden" style={{ height: 20, minWidth: 0, flex: "1 1 0" }}>
            {deals.map((d, i) => (
              <div
                key={d.label}
                className="absolute inset-y-0 left-0 flex items-center gap-1.5"
                style={{
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(6px)",
                  pointerEvents: i === active ? "auto" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(0.6875rem, 1.8vw, 0.9375rem)",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {d.label}
                </span>
                <span
                  className="hidden sm:inline"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "rgba(255,255,255,0.6)",
                    letterSpacing: "0.04em",
                  }}
                >
                  — {d.discount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ORTA — Geri sayım */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Clock size={12} color="rgba(255,255,255,0.45)" className="hidden sm:block" />
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.575rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Ends in
          </span>

          {/* Mobil: kompakt (small=true), masaüstü: büyük (small=false) */}
          <div className="flex sm:hidden items-center gap-1" style={{ lineHeight: 1 }}>
            <Digit value={hours} label="hrs" small />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", fontFamily: "var(--font-display)" }}>:</span>
            <Digit value={minutes} label="min" small />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", fontFamily: "var(--font-display)" }}>:</span>
            <Digit value={seconds} label="sec" small />
          </div>
          <div className="hidden sm:flex items-start gap-1.5">
            <Digit value={hours} label="hrs" />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.4rem", fontFamily: "var(--font-display)", lineHeight: "2.1rem" }}>:</span>
            <Digit value={minutes} label="min" />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.4rem", fontFamily: "var(--font-display)", lineHeight: "2.1rem" }}>:</span>
            <Digit value={seconds} label="sec" />
          </div>
        </div>

        {/* SAĞ — CTA: mobilde sadece ok ikonu, sm'den itibaren yazı da görünür */}
        <Link
          href="/deals"
          className="hover:bg-white/20 shrink-0"
          aria-label="Shop deals"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            padding: "0 10px",
            height: 36,
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            transition: "background 0.2s ease",
          }}
        >
          <span className="hidden sm:inline">Shop deals</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
