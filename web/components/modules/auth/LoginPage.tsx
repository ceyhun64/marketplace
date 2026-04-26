"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const { user } = useAuth.getState();
      if (!user) return;
      const roleRoutes: Record<string, string> = {
        Admin: "/admin",
        Merchant: "/merchant",
        Courier: "/courier",
        Customer: "/",
      };
      router.push(roleRoutes[user.role] ?? "/");
    } catch {}
  };

  const inputStyle = {
    width: "100%",
    padding: "0.875rem 1rem",
    background: "var(--off-white)",
    border: "1.5px solid var(--border-mid)",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.9375rem",
    color: "var(--charcoal)",
    outline: "none",
    transition:
      "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
  };

  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.6875rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "var(--charcoal-mid)",
    fontWeight: 500,
    marginBottom: "0.5rem",
    display: "block",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "var(--off-white)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "40%",
            height: "50%",
            background:
              "radial-gradient(ellipse, rgba(200,16,46,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-5%",
            width: "35%",
            height: "40%",
            background:
              "radial-gradient(ellipse, rgba(51,51,51,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            marginBottom: "2.5rem",
            textDecoration: "none",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--red)",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(200,16,46,0.25)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" fill="white" rx="1" />
              <rect
                x="8"
                y="1"
                width="5"
                height="5"
                fill="rgba(255,255,255,0.5)"
                rx="1"
              />
              <rect
                x="1"
                y="8"
                width="5"
                height="5"
                fill="rgba(255,255,255,0.5)"
                rx="1"
              />
              <rect x="8" y="8" width="5" height="5" fill="white" rx="1" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "var(--charcoal)",
              letterSpacing: "-0.02em",
            }}
          >
            BAZR
          </span>
        </Link>

        {/* Card */}
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border-light)",
            borderRadius: 20,
            padding: "2.5rem",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--red)",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 1,
                  background: "var(--red)",
                  display: "inline-block",
                }}
              />
              Account Access
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.25rem",
                fontWeight: 400,
                color: "var(--charcoal)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "0.5rem",
              }}
            >
              Welcome{" "}
              <em style={{ color: "var(--red)", fontStyle: "italic" }}>Back</em>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--charcoal-soft)",
                lineHeight: 1.6,
              }}
            >
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                style={{
                  color: "var(--red)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column" as const,
              gap: "1.25rem",
            }}
          >
            {error && (
              <div
                style={{
                  padding: "0.875rem 1rem",
                  background: "var(--red-muted)",
                  border: "1px solid var(--red-subtle)",
                  borderRadius: "0.5rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem",
                  color: "var(--red)",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    "var(--red)";
                  (e.target as HTMLInputElement).style.background =
                    "var(--white)";
                  (e.target as HTMLInputElement).style.boxShadow =
                    "0 0 0 3px var(--red-muted)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    "var(--border-mid)";
                  (e.target as HTMLInputElement).style.background =
                    "var(--off-white)";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.625rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                    transition: "color var(--duration-fast) var(--ease-out)",
                  }}
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    "var(--red)";
                  (e.target as HTMLInputElement).style.background =
                    "var(--white)";
                  (e.target as HTMLInputElement).style.boxShadow =
                    "0 0 0 3px var(--red-muted)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    "var(--border-mid)";
                  (e.target as HTMLInputElement).style.background =
                    "var(--off-white)";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: isLoading ? "var(--border-mid)" : "var(--red)",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: isLoading
                  ? "none"
                  : "0 2px 8px rgba(200,16,46,0.25)",
                transition:
                  "background var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
                marginTop: "0.5rem",
              }}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "var(--charcoal-soft)",
            textAlign: "center",
            marginTop: "1.5rem",
            letterSpacing: "0.08em",
          }}
        >
          By signing in, you agree to our{" "}
          <Link
            href="/privacy"
            style={{
              color: "var(--charcoal-mid)",
              textDecoration: "underline",
            }}
          >
            Privacy Policy
          </Link>{" "}
          &amp;{" "}
          <Link
            href="/terms"
            style={{
              color: "var(--charcoal-mid)",
              textDecoration: "underline",
            }}
          >
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
