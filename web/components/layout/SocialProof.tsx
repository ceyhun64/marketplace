"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Star, Eye, Zap, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = "purchase" | "review" | "viewing" | "stock";

interface SocialEvent {
  id: string;
  type: EventType;
  headline: string;
  subline: string;
  time: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HIDDEN_PATHS = [
  "/admin", "/merchant", "/courier", "/checkout",
  "/auth/reset-password", "/auth/forgot-password", "/unauthorized",
];

const NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Casey",
  "Morgan", "Riley", "Quinn", "Avery", "Blake", "Drew", "Emery",
];
const LOCS = [
  "New York", "London", "Los Angeles", "Chicago", "Toronto",
  "Sydney", "Berlin", "Paris", "Seattle", "Miami", "Austin",
];
const PRODUCTS = [
  "iPhone 15 Pro", "Samsung 4K TV", "Nike Air Max 90", "Dyson V15",
  "AirPods Pro 2", "Sony WH-1000XM5", "MacBook Air M3", "JBL Charge 5",
  "Xiaomi Robot Vacuum", "New Balance 990v6", "Levi's 501 Jeans", "Philips Air Fryer",
];

const THEME: Record<EventType, { color: string; bg: string; border: string }> = {
  purchase: { color: "#0d7a4e", bg: "rgba(13,122,78,0.08)",   border: "rgba(13,122,78,0.18)"  },
  review:   { color: "#b45309", bg: "rgba(180,83,9,0.08)",    border: "rgba(180,83,9,0.18)"   },
  viewing:  { color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",   border: "rgba(29,78,216,0.18)"  },
  stock:    { color: "#be123c", bg: "rgba(190,18,60,0.08)",   border: "rgba(190,18,60,0.18)"  },
};

const ICONS: Record<EventType, React.ReactNode> = {
  purchase: <ShoppingBag size={13} strokeWidth={2} />,
  review:   <Star size={13} fill="currentColor" />,
  viewing:  <Eye size={13} strokeWidth={2} />,
  stock:    <Zap size={13} fill="currentColor" />,
};

// Timing constants (ms)
const SHOW_MS  = 5500;
const PAUSE_MS = 2500;
const ENTER_MS = 380;
const EXIT_MS  = 260;
const INIT_MS  = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const minsAgo = () => `${Math.floor(Math.random() * 11) + 1}m ago`;

function makeEvent(): SocialEvent {
  const r    = Math.random();
  const prod = pick(PRODUCTS);
  const loc  = pick(LOCS);
  const name = pick(NAMES);
  const id   = Math.random().toString(36).slice(2);

  if (r < 0.40) return { id, type: "purchase", headline: `${name} just purchased`,  subline: `${prod} · ${loc}`, time: minsAgo() };
  if (r < 0.62) return { id, type: "review",   headline: `${name} left a 5★ review`, subline: `${prod} · ${loc}`, time: minsAgo() };
  if (r < 0.82) {
    const n = Math.floor(Math.random() * 24) + 8;
    return { id, type: "viewing", headline: `${n} people viewing now`, subline: prod, time: "live" };
  }
  const left = Math.floor(Math.random() * 4) + 1;
  return { id, type: "stock", headline: `Only ${left} left in stock`, subline: `${prod} · ${loc}`, time: minsAgo() };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SocialProof() {
  const pathname = usePathname() ?? "";
  const isHidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  // React state — only what drives re-renders
  const [event,     setEvent]     = useState<SocialEvent | null>(null);
  const [shown,     setShown]     = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Refs — mutated without re-renders
  const queue      = useRef<SocialEvent[]>([]);
  const barRef     = useRef<HTMLDivElement | null>(null);
  const rafId      = useRef<number | null>(null);
  const tShow      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tPause     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tExit      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tInit      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iRefill    = useRef<ReturnType<typeof setInterval> | null>(null);
  const msElapsed  = useRef(0);    // ms elapsed before last pause
  const tStart     = useRef(0);    // performance.now() when RAF last started
  const isHovering = useRef(false);
  const nextFnRef  = useRef<() => void>(() => {});

  // ── Timer helpers ──────────────────────────────────────────────────────────

  const stopRAF = () => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  // Animate the progress bar via rAF — direct DOM writes, zero re-renders
  const startRAF = useCallback((fromMs: number) => {
    stopRAF();
    msElapsed.current = fromMs;
    tStart.current    = performance.now();

    const tick = (now: number) => {
      const total = msElapsed.current + (now - tStart.current);
      const pct   = Math.min(1, total / SHOW_MS); // 0 → 1
      if (barRef.current) barRef.current.style.width = `${(1 - pct) * 100}%`;
      if (pct < 1) rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  }, []);

  // ── Core state machine ─────────────────────────────────────────────────────

  const beginExit = useCallback(() => {
    stopRAF();
    if (tShow.current) { clearTimeout(tShow.current); tShow.current = null; }
    setShown(false);                              // triggers CSS exit transition
    tExit.current = setTimeout(() => {
      setEvent(null);
      if (barRef.current) barRef.current.style.width = "100%";
      tPause.current = setTimeout(() => nextFnRef.current(), PAUSE_MS);
    }, EXIT_MS);
  }, []);

  const showEvent = useCallback((ev: SocialEvent) => {
    setEvent(ev);
    // Double rAF ensures element is in DOM (event !== null) before
    // `shown = true` triggers the CSS enter transition
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setShown(true);
        startRAF(0);
        tShow.current = setTimeout(beginExit, SHOW_MS);
      }),
    );
  }, [startRAF, beginExit]);

  const showNext = useCallback(() => {
    if (dismissed || isHidden) return;
    // Refill inline if queue dried up
    if (queue.current.length === 0) {
      for (let i = 0; i < 6; i++) queue.current.push(makeEvent());
    }
    const [next, ...rest] = queue.current;
    queue.current = rest;
    showEvent(next);
  }, [dismissed, isHidden, showEvent]);

  // Keep ref in sync so setTimeout callbacks always call the latest closure
  nextFnRef.current = showNext;

  // ── Hover pause / resume ───────────────────────────────────────────────────

  const handleMouseEnter = useCallback(() => {
    if (isHovering.current || !shown) return;
    isHovering.current = true;
    stopRAF();
    msElapsed.current += performance.now() - tStart.current;
    if (tShow.current) { clearTimeout(tShow.current); tShow.current = null; }
  }, [shown]);

  const handleMouseLeave = useCallback(() => {
    if (!isHovering.current) return;
    isHovering.current = false;
    const remaining = SHOW_MS - msElapsed.current;
    if (remaining <= 0) { beginExit(); return; }
    startRAF(msElapsed.current);
    tShow.current = setTimeout(beginExit, remaining);
  }, [beginExit, startRAF]);

  // ── Dismiss ────────────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    stopRAF();
    [tShow, tPause, tExit, tInit].forEach((r) => {
      if (r.current) { clearTimeout(r.current); r.current = null; }
    });
    if (iRefill.current) { clearInterval(iRefill.current); iRefill.current = null; }
    setShown(false);
    tExit.current = setTimeout(() => {
      setEvent(null);
      setDismissed(true);
    }, EXIT_MS);
  }, []);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isHidden || dismissed) return;

    tInit.current = setTimeout(() => {
      for (let i = 0; i < 12; i++) queue.current.push(makeEvent());
      nextFnRef.current();
    }, INIT_MS);

    iRefill.current = setInterval(() => {
      if (queue.current.length < 8) queue.current.push(makeEvent());
    }, 9_000);

    return () => {
      stopRAF();
      if (tInit.current)   clearTimeout(tInit.current);
      if (tShow.current)   clearTimeout(tShow.current);
      if (tPause.current)  clearTimeout(tPause.current);
      if (tExit.current)   clearTimeout(tExit.current);
      if (iRefill.current) clearInterval(iRefill.current);
    };
  }, [isHidden, dismissed]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isHidden || dismissed || !event) return null;

  const theme  = THEME[event.type];
  const isLive = event.time === "live";

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "fixed",
          bottom: "5.5rem",
          left: "1.5rem",
          zIndex: 9000,
          width: 296,
          pointerEvents: "auto",
          // CSS transition drives enter/exit — no keyframe strings needed
          transform: shown ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          opacity:   shown ? 1 : 0,
          transition: `transform ${shown ? ENTER_MS : EXIT_MS}ms cubic-bezier(0.34,1.56,0.64,1), opacity ${shown ? ENTER_MS : EXIT_MS}ms ease`,
          willChange: "transform, opacity",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.055)",
            overflow: "hidden",
          }}
        >
          {/* Depleting progress track */}
          <div style={{ height: 2.5, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div
              ref={barRef}
              style={{
                height: "100%",
                width: "100%",          // managed by rAF, not React state
                background: theme.color,
              }}
            />
          </div>

          <div
            style={{
              padding: "13px 11px 14px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            {/* Icon badge */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.color,
                flexShrink: 0,
                marginTop: 1,
                position: "relative",
              }}
            >
              {ICONS[event.type]}
              {/* Pulsing live dot */}
              {isLive && (
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: theme.color,
                    border: "1.5px solid #fff",
                    animation: "sp-pulse 1.8s ease-in-out infinite",
                  }}
                />
              )}
            </div>

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-body, system-ui)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#111",
                  lineHeight: 1.35,
                  margin: "0 0 2px",
                }}
              >
                {event.headline}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body, system-ui)",
                  fontSize: "0.6875rem",
                  color: "rgba(0,0,0,0.42)",
                  lineHeight: 1.4,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {event.subline}
              </p>
              <div style={{ marginTop: 5 }}>
                {isLive ? (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: theme.color,
                    }}
                  >
                    ● Live
                  </span>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.5625rem",
                      letterSpacing: "0.04em",
                      color: "rgba(0,0,0,0.3)",
                    }}
                  >
                    {event.time}
                  </span>
                )}
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={dismiss}
              aria-label="Dismiss notification"
              className="sp-dismiss"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "rgba(0,0,0,0.28)",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
                marginTop: -1,
                transition: "color 0.15s, background 0.15s",
              }}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .sp-dismiss:hover {
          color: rgba(0,0,0,0.65) !important;
          background: rgba(0,0,0,0.07) !important;
        }
        @keyframes sp-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.6); opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
