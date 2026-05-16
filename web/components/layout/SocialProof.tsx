"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Star, Eye, Package, X } from "lucide-react";

interface SocialEvent {
  id: string;
  type: "purchase" | "review" | "viewing" | "stock";
  icon: React.ReactNode;
  message: string;
  location: string;
  time: string;
}

// Panel routes where the social proof popup should NOT appear
const HIDDEN_PATHS = [
  "/admin",
  "/merchant",
  "/courier",
  "/checkout",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/unauthorized",
];

const LOCATIONS = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Konya",
  "Kayseri",
  "Denizli",
  "Eskişehir",
  "Trabzon",
  "Adana",
  "Gaziantep",
  "Mersin",
  "Diyarbakır",
  "Kocaeli",
];

const PRODUCTS = [
  "iPhone 15 Pro",
  "Samsung 4K TV",
  "Nike Air Max",
  "Dyson V15",
  "AirPods Pro",
  "Xiaomi Robot Vacuum",
  "Levi's 501 Jeans",
  "Sony WH-1000XM5",
  "MacBook Air M3",
  "Instax Mini 12",
  "JBL Charge 5",
  "Philips Air Fryer",
  "New Balance 990",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function minutesAgo() {
  const mins = Math.floor(Math.random() * 12) + 1;
  return `${mins}d önce`;
}

function generateEvent(): SocialEvent {
  const r = Math.random();
  const product = randomFrom(PRODUCTS);
  const loc = randomFrom(LOCATIONS);

  if (r < 0.4) {
    return {
      id: Math.random().toString(36).slice(2),
      type: "purchase",
      icon: <ShoppingBag size={13} />,
      message: `${product} satın alındı`,
      location: loc,
      time: minutesAgo(),
    };
  } else if (r < 0.62) {
    return {
      id: Math.random().toString(36).slice(2),
      type: "review",
      icon: <Star size={13} />,
      message: `${product} için 5★ yorum`,
      location: loc,
      time: minutesAgo(),
    };
  } else if (r < 0.82) {
    const count = Math.floor(Math.random() * 28) + 6;
    return {
      id: Math.random().toString(36).slice(2),
      type: "viewing",
      icon: <Eye size={13} />,
      message: `${count} kişi şu an inceliyor`,
      location: loc,
      time: "şu an",
    };
  } else {
    const left = Math.floor(Math.random() * 4) + 1;
    return {
      id: Math.random().toString(36).slice(2),
      type: "stock",
      icon: <Package size={13} />,
      message: `Son ${left} adet — ${product}`,
      location: loc,
      time: minutesAgo(),
    };
  }
}

const COLOR_MAP: Record<
  SocialEvent["type"],
  { bg: string; icon: string; bar: string }
> = {
  purchase: { bg: "rgba(13,122,78,0.1)", icon: "#0d7a4e", bar: "#0d7a4e" },
  review: { bg: "rgba(245,158,11,0.1)", icon: "#d97706", bar: "#d97706" },
  viewing: { bg: "rgba(59,130,246,0.1)", icon: "#3b82f6", bar: "#3b82f6" },
  stock: { bg: "rgba(200,16,46,0.1)", icon: "var(--red)", bar: "var(--red)" },
};

export default function SocialProof() {
  const pathname = usePathname() || "";
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [visible, setVisible] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<SocialEvent[]>([]);

  // Hide on panel routes
  const isHidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const showNext = () => {
    if (queueRef.current.length === 0 || dismissed) return;
    const [next, ...rest] = queueRef.current;
    queueRef.current = rest;
    setVisible(next.id);
    setEvents((prev) => [next, ...prev].slice(0, 5));
    setProgress(100);

    // Animate progress bar
    const start = Date.now();
    const duration = 5500;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) {
        if (progressRef.current) clearInterval(progressRef.current);
      }
    }, 50);

    timeoutRef.current = setTimeout(() => {
      setVisible(null);
      setTimeout(showNext, 2200);
    }, duration);
  };

  useEffect(() => {
    if (isHidden || dismissed) return;

    const init = setTimeout(() => {
      for (let i = 0; i < 12; i++) queueRef.current.push(generateEvent());
      showNext();
    }, 5000);

    const refill = setInterval(() => {
      queueRef.current.push(generateEvent());
    }, 9000);

    return () => {
      clearTimeout(init);
      clearInterval(refill);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHidden, dismissed]);

  if (isHidden || dismissed) return null;

  const currentEvent = events.find((e) => e.id === visible);
  if (!currentEvent) return null;

  const colors = COLOR_MAP[currentEvent.type];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "5.5rem",
        left: "1.5rem",
        zIndex: 9000,
        maxWidth: 300,
        pointerEvents: "auto",
        animation: visible
          ? "spSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both"
          : "spSlideOut 0.3s ease both",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(30,30,30,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${progress}%`,
            height: 2,
            background: colors.bar,
            transition: "width 0.05s linear",
            borderRadius: "0 2px 0 0",
          }}
        />

        <div
          style={{
            padding: "0.875rem 0.875rem 0.875rem 1rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.625rem",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: colors.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.icon,
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {currentEvent.icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--charcoal)",
                lineHeight: 1.35,
                marginBottom: "0.25rem",
              }}
            >
              {currentEvent.message}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              {/* Location dot */}
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: colors.bar,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.6875rem",
                  color: "var(--charcoal-soft)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentEvent.location}
              </span>
              <span style={{ color: "rgba(51,51,51,0.2)", fontSize: "0.5rem" }}>
                •
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.5625rem",
                  letterSpacing: "0.04em",
                  color: "rgba(51,51,51,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                {currentEvent.time}
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => {
              clearTimers();
              setVisible(null);
              setDismissed(true);
            }}
            aria-label="Kapat"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "rgba(51,51,51,0.3)",
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
              transition: "color 0.15s, background 0.15s",
              marginTop: 1,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "var(--charcoal)";
              el.style.background = "rgba(51,51,51,0.06)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "rgba(51,51,51,0.3)";
              el.style.background = "transparent";
            }}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spSlideOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
}
