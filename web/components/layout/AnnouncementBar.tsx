"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnnouncements, type AnnouncementItem } from "@/queries/useSiteSettings";

// ── Fallback data — shown while the API loads or if it fails ─────────────────

const FALLBACK: AnnouncementItem[] = [
  {
    id: "fallback-1",
    text: "Free shipping on orders over $50 — ",
    ctaText: "Shop now",
    ctaUrl: "/products",
    backgroundColor: "#1e1e1e",
    textColor: "rgba(255,255,255,0.85)",
    isActive: true,
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-2",
    text: "New sellers welcome! Start your store today — ",
    ctaText: "Apply now",
    ctaUrl: "/auth/apply-merchant",
    backgroundColor: "#1e1e1e",
    textColor: "rgba(255,255,255,0.85)",
    isActive: true,
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-3",
    text: "Flash deals updated daily — ",
    ctaText: "See today's deals",
    ctaUrl: "/deals",
    backgroundColor: "#1e1e1e",
    textColor: "rgba(255,255,255,0.85)",
    isActive: true,
    sortOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
];

const DISMISSED_KEY = "bazr_announcement_dismissed_v2";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnnouncementBar() {
  const { data: apiItems } = useAnnouncements();

  // Priority: real API data → static fallback while loading or on error.
  // Fallback is shown immediately so the bar height is stable from first paint.
  const items: AnnouncementItem[] =
    apiItems && apiItems.length > 0 ? apiItems : FALLBACK;

  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible || items.length < 2) return;
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [visible, items.length]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!mounted || !visible || items.length === 0) return null;

  const ann = items[current];

  return (
    <div
      style={{
        background: ann.backgroundColor || "var(--charcoal)",
        padding: "0.625rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* Prev */}
      {items.length > 1 && (
        <button
          onClick={() => setCurrent((p) => (p - 1 + items.length) % items.length)}
          aria-label="Previous announcement"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", display: "flex",
            padding: 4, borderRadius: 4, flexShrink: 0,
          }}
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* Message */}
      <p
        key={ann.id}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.8125rem",
          color: ann.textColor || "rgba(255,255,255,0.85)",
          margin: 0,
          textAlign: "center",
          animation: "fadeInAnn 0.3s ease both",
        }}
      >
        {ann.text}
        {ann.ctaUrl && ann.ctaText && (
          <Link
            href={ann.ctaUrl}
            style={{
              color: "#fff",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            {ann.ctaText}
          </Link>
        )}
      </p>

      {/* Next */}
      {items.length > 1 && (
        <button
          onClick={() => setCurrent((p) => (p + 1) % items.length)}
          aria-label="Next announcement"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", display: "flex",
            padding: 4, borderRadius: 4, flexShrink: 0,
          }}
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Announcement ${i + 1}`}
              style={{
                width: i === current ? 16 : 5,
                height: 5,
                borderRadius: 999,
                background: i === current ? "#fff" : "rgba(255,255,255,0.25)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.25s ease, background 0.25s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.4)",
          display: "flex",
          padding: 4,
          borderRadius: 4,
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes fadeInAnn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
