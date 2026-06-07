"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  ChevronRight,
  Home,
} from "lucide-react";
import { FlashSaleFilteredGrid } from "@/components/modules/flash-sale/FlashSaleFilteredGrid";

// -- Countdown hook ------------------------------------------------------------
function useCountdown(end: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, end.getTime() - Date.now());
    return {
      hours:   Math.floor(diff / 1000 / 60 / 60),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [end]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

// -- Animated digit ------------------------------------------------------------
function Digit({ value }: { value: number }) {
  const [prev, setPrev]     = useState(value);
  const [flash, setFlash]   = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setPrev(value);
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <span
      className="tabular-nums font-bold leading-none transition-all duration-150"
      style={{
        display: "inline-block",
        transform: flash ? "scale(1.18)" : "scale(1)",
        color: flash ? "#ff3355" : "white",
        fontSize: "clamp(1.5rem, 3vw, 2rem)",
        letterSpacing: "-0.03em",
      }}
    >
      {String(value).padStart(2, "0")}
    </span>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="rounded-xl flex items-center justify-center min-w-14 h-14"
        style={{
          background: "rgba(200,16,46,0.15)",
          border: "1.5px solid rgba(200,16,46,0.35)",
        }}
      >
        <Digit value={value} />
      </div>
      <span
        className="text-[9px] uppercase tracking-[2px] font-bold"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {label}
      </span>
    </div>
  );
}

// -- Scrolling ticker ----------------------------------------------------------
const TICKER_MSG =
  "⚡ FLASH SALE IS LIVE — Up to 50% off on selected products — " +
  "Limited stock — Free shipping over $500 — Don't miss out — ";

function Ticker() {
  return (
    <div
      className="overflow-hidden whitespace-nowrap select-none"
      style={{ background: "#c8102e", height: 34 }}
    >
      <style>{`
        @keyframes fs-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .fs-ticker-inner {
          display: inline-block;
          animation: fs-ticker 28s linear infinite;
        }
        @keyframes fs-pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .fs-live-dot { animation: fs-pulse-dot 1.2s ease-in-out infinite; }
        @keyframes fs-ring-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(200,16,46,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(200,16,46,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,16,46,0); }
        }
        .fs-countdown-pulse { animation: fs-ring-pulse 2s ease-out infinite; }
      `}</style>
      <span className="fs-ticker-inner text-white text-xs font-semibold tracking-wide leading-8.5">
        {TICKER_MSG.repeat(6)}
      </span>
    </div>
  );
}

// -- Page ----------------------------------------------------------------------
export default function FlashSalePage() {
  const [saleEnd] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const countdown = useCountdown(saleEnd);

  const totalSeconds =
    countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
  const isUrgent = totalSeconds < 3600; // under 1 hour

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* -- Ticker --------------------------------------------------------- */}
      <Ticker />

      {/* -- Hero ----------------------------------------------------------- */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{
          background:
            "radial-gradient(ellipse at 60% 0%, #3d0011 0%, #1a0008 40%, #0f0f0f 100%)",
        }}
      >
        {/* Sweep glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 60%, rgba(200,16,46,0.22) 0%, transparent 55%)",
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 mb-6 text-[12px]"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="w-3 h-3" />Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">Flash Sale</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end gap-8 justify-between">
            {/* Left */}
            <div>
              {/* LIVE badge */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(200,16,46,0.25)", color: "#ff4466", border: "1px solid rgba(200,16,46,0.4)" }}
                >
                  <span
                    className="fs-live-dot w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: "#ff4466" }}
                  />
                  Live
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-jetbrains)" }}
                >
                  Limited Time Offer
                </span>
              </div>

              <h1
                className="text-white leading-none mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(3rem, 7vw, 5rem)",
                  fontWeight: 700,
                  textShadow: "0 0 60px rgba(200,16,46,0.5)",
                }}
              >
                Flash{" "}
                <span
                  style={{
                    color: "#ff3355",
                    textShadow: "0 0 40px rgba(255,51,85,0.6)",
                  }}
                >
                  Sale
                </span>
              </h1>

              <p
                className="text-[15px] max-w-sm mb-0"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Up to{" "}
                <span className="font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  50% off
                </span>{" "}
                on selected products. Stock is limited.
              </p>
            </div>

            {/* Right: countdown */}
            <div className="shrink-0">
              <div
                className="flex items-center gap-1.5 mb-3"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span
                  className="text-[11px] uppercase tracking-[2px] font-bold"
                  style={{ color: isUrgent ? "#ff4466" : "rgba(255,255,255,0.35)" }}
                >
                  {isUrgent ? "⚡ Ending soon!" : "Sale ends in"}
                </span>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-2xl"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <CountdownUnit value={countdown.hours}   label="Hrs" />
                <span className="text-xl font-bold pb-5 select-none" style={{ color: "rgba(200,16,46,0.6)" }}>:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="text-xl font-bold pb-5 select-none" style={{ color: "rgba(200,16,46,0.6)" }}>:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Filtered grid -------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <FlashSaleFilteredGrid />
      </div>
    </main>
  );
}
