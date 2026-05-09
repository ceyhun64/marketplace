"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const ANNOUNCEMENTS = [
  {
    text: "Free shipping on orders over ₺500 — ",
    cta: "Shop now",
    href: "/products",
  },
  {
    text: "New sellers welcome! Start your store today — ",
    cta: "Apply now",
    href: "/auth/apply-merchant",
  },
  {
    text: "Flash deals updated daily — ",
    cta: "See today's deals",
    href: "/deals",
  },
];

const DISMISSED_KEY = "bazr_announcement_dismissed_v1";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [visible]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  const ann = ANNOUNCEMENTS[current];

  return (
    <div
      style={{
        background: "var(--charcoal)",
        padding: "0.625rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        position: "relative",
        zIndex: 60,
      }}
    >
      {/* Prev */}
      <button
        onClick={() => setCurrent((p) => (p - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
        aria-label="Previous announcement"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.4)",
          display: "flex",
          padding: 4,
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Message */}
      <p
        key={current}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.8125rem",
          color: "rgba(255,255,255,0.85)",
          margin: 0,
          textAlign: "center",
          animation: "fadeInAnn 0.3s ease both",
        }}
      >
        {ann.text}
        <Link
          href={ann.href}
          style={{
            color: "#fff",
            fontWeight: 700,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          {ann.cta}
        </Link>
      </p>

      {/* Next */}
      <button
        onClick={() => setCurrent((p) => (p + 1) % ANNOUNCEMENTS.length)}
        aria-label="Next announcement"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.4)",
          display: "flex",
          padding: 4,
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        <ChevronRight size={14} />
      </button>

      {/* Dots */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {ANNOUNCEMENTS.map((_, i) => (
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
