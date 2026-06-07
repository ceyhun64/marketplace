"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, ShieldCheck, Settings } from "lucide-react";

const COOKIE_KEY = "bazr_cookie_consent";

type ConsentState = "all" | "necessary" | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(COOKIE_KEY);
    if (!saved) {
      // Show with a small delay for better UX
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (type: ConsentState) => {
    localStorage.setItem(COOKIE_KEY, type ?? "necessary");
    setVisible(false);
    // Dispatch event so analytics/tag managers can react
    window.dispatchEvent(new CustomEvent("bazr:cookieConsent", { detail: type }));
  };

  if (!mounted || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "min(90vw, 620px)",
        animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <div
        style={{
          background: "var(--charcoal)",
          borderRadius: 20,
          padding: "1.75rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={() => accept("necessary")}
          aria-label="Close cookie banner"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(255,255,255,0.07)",
            border: "none",
            borderRadius: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            transition: "background 0.15s ease",
          }}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(200,16,46,0.15)",
              border: "1px solid rgba(200,16,46,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Cookie size={18} color="var(--red-light)" />
          </div>
          <div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1875rem",
                fontWeight: 500,
                color: "#fff",
                margin: "0 0 0.25rem",
                letterSpacing: "-0.01em",
              }}
            >
              Your privacy matters.
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.5)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              We use cookies to enhance your experience, analyze traffic, and
              personalize ads.{" "}
              <Link
                href="/privacy"
                style={{ color: "rgba(255,255,255,0.75)", textDecoration: "underline" }}
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Details toggle */}
        {showDetails && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {[
              {
                icon: <ShieldCheck size={14} />,
                name: "Strictly Necessary",
                desc: "Authentication, cart, security. Cannot be disabled.",
                required: true,
              },
              {
                icon: <Settings size={14} />,
                name: "Analytics",
                desc: "Helps us understand how visitors interact with the site.",
                required: false,
              },
              {
                icon: <Cookie size={14} />,
                name: "Marketing",
                desc: "Used to show relevant ads and measure campaign effectiveness.",
                required: false,
              },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                }}
              >
                <div
                  style={{
                    color: item.required ? "var(--success)" : "rgba(255,255,255,0.4)",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    {item.name}
                    {item.required && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.5rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--success)",
                          background: "rgba(13,122,78,0.12)",
                          border: "1px solid rgba(13,122,78,0.2)",
                          borderRadius: 4,
                          padding: "1px 5px",
                        }}
                      >
                        Always on
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.6875rem",
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => accept("all")}
            style={{
              background: "var(--red)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "0.625rem 1.25rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 2px 12px rgba(200,16,46,0.3)",
              transition: "background 0.15s ease",
            }}
          >
            Accept All
          </button>

          <button
            onClick={() => accept("necessary")}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "0.625rem 1.25rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s ease",
            }}
          >
            Necessary Only
          </button>

          <button
            onClick={() => setShowDetails((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              cursor: "pointer",
              padding: "0.625rem 0.5rem",
              textDecoration: "underline",
              marginLeft: "auto",
            }}
          >
            {showDetails ? "Hide details" : "Cookie settings"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
