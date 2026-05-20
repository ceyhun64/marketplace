"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  variant: "login" | "register";
}

export default function AuthSplitLayout({ children, variant }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#111111" }}>

      {/* Ambient red glow — top centre */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,16,46,0.09) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 shrink-0 w-full max-w-120 mx-auto px-6 pt-8 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ background: "var(--red)", boxShadow: "0 2px 10px rgba(200,16,46,0.32)" }}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "1.125rem",
              fontWeight:    500,
              color:         "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight:    1,
            }}
          >
            BAZR
          </span>
        </Link>

        {variant === "login" ? (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-body)" }}>
            No account?{" "}
            <Link
              href="/auth/register"
              className="font-bold transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.68)" }}
            >
              Register
            </Link>
          </p>
        ) : (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-body)" }}>
            Have an account?{" "}
            <Link
              href="/auth/login"
              className="font-bold transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.68)" }}
            >
              Sign in
            </Link>
          </p>
        )}
      </header>

      {/* Form area */}
      <main className="relative z-10 flex-1 flex items-start md:items-center justify-center px-4 py-8 md:py-10">
        <div className="w-full max-w-120">
          <div
            className="rounded-3xl px-8 py-9 sm:px-10 sm:py-10"
            style={{
              background:            "rgba(255,255,255,0.032)",
              border:                "1px solid rgba(255,255,255,0.08)",
              backdropFilter:        "blur(28px)",
              WebkitBackdropFilter:  "blur(28px)",
              boxShadow:             "0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 pb-8 text-center">
        <p
          className="text-[10px] font-mono uppercase tracking-[2.5px]"
          style={{ color: "rgba(255,255,255,0.12)" }}
        >
          256-bit SSL encryption · GDPR compliant · No spam, ever
        </p>
      </footer>
    </div>
  );
}
