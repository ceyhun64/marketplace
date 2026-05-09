"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Star, Eye, Package } from "lucide-react";

interface SocialEvent {
  id: string;
  type: "purchase" | "review" | "viewing" | "stock";
  icon: React.ReactNode;
  message: string;
  location: string;
  time: string;
}

const LOCATIONS = [
  "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
  "Konya", "Kayseri", "Denizli", "Eskişehir", "Trabzon",
];

const PRODUCTS = [
  "iPhone 15 Pro", "Samsung 4K TV", "Nike Air Max", "Dyson V15",
  "AirPods Pro", "Xiaomi Robot Vacuum", "Levi's 501 Jeans",
  "Sony WH-1000XM5", "MacBook Air M3", "Instax Mini 12",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function minutesAgo() {
  const mins = Math.floor(Math.random() * 10) + 1;
  return `${mins}m ago`;
}

function generateEvent(): SocialEvent {
  const r = Math.random();
  const product = randomFrom(PRODUCTS);
  const loc = randomFrom(LOCATIONS);

  if (r < 0.4) {
    return {
      id: Math.random().toString(36).slice(2),
      type: "purchase",
      icon: <ShoppingBag size={14} />,
      message: `Someone just bought ${product}`,
      location: loc,
      time: minutesAgo(),
    };
  } else if (r < 0.65) {
    return {
      id: Math.random().toString(36).slice(2),
      type: "review",
      icon: <Star size={14} />,
      message: `New 5★ review on ${product}`,
      location: loc,
      time: minutesAgo(),
    };
  } else if (r < 0.85) {
    return {
      id: Math.random().toString(36).slice(2),
      type: "viewing",
      icon: <Eye size={14} />,
      message: `${Math.floor(Math.random() * 30) + 5} people viewing ${product}`,
      location: loc,
      time: "now",
    };
  } else {
    return {
      id: Math.random().toString(36).slice(2),
      type: "stock",
      icon: <Package size={14} />,
      message: `Only ${Math.floor(Math.random() * 5) + 1} left in stock — ${product}`,
      location: loc,
      time: minutesAgo(),
    };
  }
}

const COLOR_MAP: Record<SocialEvent["type"], { bg: string; icon: string }> = {
  purchase: { bg: "rgba(13,122,78,0.1)", icon: "#0d7a4e" },
  review: { bg: "rgba(245,158,11,0.1)", icon: "#d97706" },
  viewing: { bg: "rgba(59,130,246,0.1)", icon: "#3b82f6" },
  stock: { bg: "rgba(200,16,46,0.1)", icon: "var(--red)" },
};

export default function SocialProof() {
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [visible, setVisible] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const queueRef = useRef<SocialEvent[]>([]);

  const showNext = () => {
    if (queueRef.current.length === 0) return;
    const [next, ...rest] = queueRef.current;
    queueRef.current = rest;
    setVisible(next.id);
    setEvents((prev) => [next, ...prev].slice(0, 5));

    timeoutRef.current = setTimeout(() => {
      setVisible(null);
      setTimeout(showNext, 2000);
    }, 5500);
  };

  useEffect(() => {
    // Initial delay before first notification
    const init = setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        queueRef.current.push(generateEvent());
      }
      showNext();
    }, 4000);

    // Keep queue topped up
    const refill = setInterval(() => {
      queueRef.current.push(generateEvent());
    }, 8000);

    return () => {
      clearTimeout(init);
      clearInterval(refill);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
        animation: visible ? "socialSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" : "socialSlideOut 0.3s ease both",
        maxWidth: 320,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(30,30,30,0.06)",
          padding: "0.875rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.icon,
            flexShrink: 0,
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
              lineHeight: 1.3,
              marginBottom: "0.1875rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.6875rem",
                color: "var(--charcoal-mist)",
              }}
            >
              {currentEvent.location}
            </span>
            <span style={{ color: "var(--border-mid)", fontSize: "0.5rem" }}>•</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5625rem",
                letterSpacing: "0.06em",
                color: "var(--charcoal-mist)",
              }}
            >
              {currentEvent.time}
            </span>
          </div>
        </div>

        {/* Pulse indicator */}
        <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: colors.icon,
              opacity: 0.3,
              animation: "socialPulse 1.5s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 2,
              borderRadius: "50%",
              background: colors.icon,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes socialSlideIn {
          from { opacity: 0; transform: translateX(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes socialSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-10px); }
        }
        @keyframes socialPulse {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
