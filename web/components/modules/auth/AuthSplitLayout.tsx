"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  variant: "login" | "register";
}

export default function AuthSplitLayout({ children, variant }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-(--bg-page)">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-[35%] h-[35%] rounded-full bg-(--red)/4 blur-[120px]" />
        <div className="absolute bottom-[15%] left-[5%] w-[30%] h-[30%] rounded-full bg-(--charcoal-mid)/4 blur-[100px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 shrink-0 w-full max-w-120 mx-auto px-6 pt-8 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ background: "var(--red)", boxShadow: "0 2px 10px rgba(200,16,46,0.22)" }}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-lg text-(--charcoal) tracking-tight leading-none" style={{ fontWeight: 500 }}>
            BAZR
          </span>
        </Link>

        {variant === "login" ? (
          <p className="text-sm text-(--charcoal-soft)">
            No account?{" "}
            <Link href="/auth/register" className="font-bold text-(--charcoal) hover:text-(--red) transition-colors">
              Register
            </Link>
          </p>
        ) : (
          <p className="text-sm text-(--charcoal-soft)">
            Have an account?{" "}
            <Link href="/auth/login" className="font-bold text-(--charcoal) hover:text-(--red) transition-colors">
              Sign in
            </Link>
          </p>
        )}
      </header>

      {/* Form area */}
      <main className="relative z-10 flex-1 flex items-start md:items-center justify-center px-4 py-8 md:py-10">
        <div className="w-full max-w-120">
          <div className="bg-white border border-(--border-light) rounded-[40px] px-8 py-9 sm:px-10 sm:py-10 shadow-(--shadow-lg)">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 pb-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-(--charcoal-mist) opacity-50">
          256-bit SSL encryption · GDPR compliant · No spam, ever
        </p>
      </footer>
    </div>
  );
}
