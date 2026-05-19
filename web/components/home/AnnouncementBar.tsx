"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  text: string;
  /** Bold accent word(s) within the text */
  highlight?: string;
  cta?: { label: string; href: string };
}

interface AnnouncementBarProps {
  announcements?: Announcement[];
  intervalMs?: number;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const DEFAULT: Announcement[] = [
  {
    id: "a1",
    text: "Free shipping on orders over",
    highlight: "$75",
    cta: { label: "Shop Now", href: "/products" },
  },
  {
    id: "a2",
    text: "New arrivals —",
    highlight: "up to 40% off",
    cta: { label: "Discover", href: "/products?sort=newest" },
  },
  {
    id: "a3",
    text: "Join",
    highlight: "50,000+ merchants",
    cta: { label: "Start Selling Free", href: "/auth/register-merchant" },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnnouncementBar({
  announcements = DEFAULT,
  intervalMs = 4500,
}: AnnouncementBarProps) {
  const [show, setShow]       = useState(true);
  const [idx, setIdx]         = useState(0);
  const [fading, setFading]   = useState(false);

  const advance = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setIdx((i) => (i + 1) % announcements.length);
      setFading(false);
    }, 280);
  }, [announcements.length]);

  useEffect(() => {
    if (!show || announcements.length < 2) return;
    const id = setInterval(advance, intervalMs);
    return () => clearInterval(id);
  }, [show, advance, intervalMs, announcements.length]);

  if (!show) return null;

  const current = announcements[idx];

  return (
    <aside
      role="region"
      aria-label="Announcements"
      style={{
        background:
          "linear-gradient(90deg, #0C0C0E 0%, #18101C 50%, #0C0C0E 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
      className="relative z-50 py-2.5 px-4"
    >
      <div className="max-w-7xl mx-auto relative flex items-center justify-center">
        {/* Step indicators */}
        {announcements.length > 1 && (
          <div className="absolute left-0 hidden sm:flex items-center gap-1" aria-hidden>
            {announcements.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to announcement ${i + 1}`}
                className="rounded-full transition-all duration-400"
                style={{
                  height: "3px",
                  width: i === idx ? "14px" : "3px",
                  background:
                    i === idx
                      ? "#C8102E"
                      : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}

        {/* Text */}
        <p
          className="text-xs sm:text-[0.8125rem] leading-none transition-all duration-[280ms] select-none"
          style={{
            color: "rgba(255,255,255,0.62)",
            opacity: fading ? 0 : 1,
            transform: fading ? "translateY(-5px)" : "translateY(0)",
            fontFamily: "var(--font-body)",
          }}
        >
          {current.text}{" "}
          {current.highlight && (
            <span className="font-semibold" style={{ color: "#E8E8EC" }}>
              {current.highlight}
            </span>
          )}
          {current.cta && (
            <>
              {" — "}
              <Link
                href={current.cta.href}
                className="inline-flex items-center gap-0.5 font-semibold transition-opacity duration-200 hover:opacity-80 group"
                style={{ color: "#C8102E" }}
              >
                {current.cta.label}
                <ChevronRight
                  className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
            </>
          )}
        </p>

        {/* Dismiss */}
        <button
          onClick={() => setShow(false)}
          aria-label="Dismiss announcements"
          className="absolute right-0 p-1 rounded transition-all duration-200 hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
