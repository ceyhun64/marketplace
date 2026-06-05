"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const PERKS = [
  "Exclusive deals before anyone else",
  "Weekly curated product picks",
  "Seller tips & marketplace updates",
];

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    // Simulate API call — replace with real endpoint
    await new Promise((r) => setTimeout(r, 900));
    setStatus("success");
    setEmail("");
  };

  return (
    <section
      style={{
        padding: "6rem 0",
        background: "var(--off-white)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80vw",
          height: "80vw",
          maxWidth: 900,
          maxHeight: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(200,16,46,0.03) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="max-w-325 mx-auto px-4 sm:px-8 relative z-10"
      >
        {/*
         * padding: "4rem" was 64px on every side — on 320px phones that left
         * only 192px for content AND forced a 2-column layout via inline
         * gridTemplateColumns which overrode the Tailwind grid-cols-1 class.
         * Fixed: responsive Tailwind padding + grid classes only (no inline).
         */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-16 px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20 shadow-(--shadow-md)"
          style={{
            background: "var(--white)",
            border: "1px solid var(--border-light)",
            borderRadius: 28,
          }}
        >
          {/* Left: Copy */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--red-muted)",
                border: "1px solid var(--red-subtle)",
                borderRadius: 999,
                padding: "4px 14px",
                marginBottom: "1.5rem",
              }}
            >
              <Sparkles size={12} color="var(--red)" />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--red)",
                }}
              >
                Newsletter
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.875rem, 3vw, 2.75rem)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--charcoal)",
                marginBottom: "1rem",
              }}
            >
              Stay ahead of{" "}
              <em style={{ color: "var(--red)", fontStyle: "italic" }}>
                the deal.
              </em>
            </h2>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9375rem",
                color: "var(--charcoal-soft)",
                lineHeight: 1.7,
                marginBottom: "2rem",
              }}
            >
              Join 40,000+ shoppers getting the best offers, new arrivals, and
              marketplace news delivered weekly.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {PERKS.map((p) => (
                <li
                  key={p}
                  style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
                >
                  <CheckCircle2 size={15} color="var(--success)" />
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--charcoal-soft)",
                    }}
                  >
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Form */}
          <div>
            {status === "success" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "3rem 2rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(13,122,78,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={28} color="var(--success)" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 500,
                      color: "var(--charcoal)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    You're in!
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--charcoal-soft)",
                    }}
                  >
                    Check your inbox for a welcome surprise.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    background: "var(--off-white)",
                    border: "1.5px solid var(--border-light)",
                    borderRadius: 16,
                    padding: "2rem",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--charcoal-soft)",
                      marginBottom: "0.625rem",
                    }}
                  >
                    Your email address
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div
                      className="flex-1"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "var(--white)",
                        border: `1.5px solid ${status === "error" ? "var(--red)" : "var(--border-mid)"}`,
                        borderRadius: 10,
                        padding: "0 14px",
                        gap: "0.5rem",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      <Mail size={15} color="var(--charcoal-mist)" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setStatus("idle");
                          setErrorMsg("");
                        }}
                        placeholder="name@email.com"
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontFamily: "var(--font-body)",
                          fontSize: "0.9375rem",
                          color: "var(--charcoal)",
                          padding: "0.75rem 0",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full sm:w-auto justify-center"
                      style={{
                        background: status === "loading" ? "var(--charcoal-soft)" : "var(--charcoal)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "0.75rem 1.25rem",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: status === "loading" ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        flexShrink: 0,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {status === "loading" ? (
                        <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      ) : (
                        <>Subscribe <ArrowRight size={13} /></>
                      )}
                    </button>
                  </div>

                  {status === "error" && (
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.75rem",
                        color: "var(--red)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {errorMsg}
                    </p>
                  )}

                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.6875rem",
                      color: "var(--charcoal-mist)",
                      lineHeight: 1.5,
                    }}
                  >
                    No spam, ever. Unsubscribe at any time. By subscribing you
                    agree to our{" "}
                    <a
                      href="/privacy"
                      style={{ color: "var(--charcoal-soft)", textDecoration: "underline" }}
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
