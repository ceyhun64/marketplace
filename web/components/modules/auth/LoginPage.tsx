"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import PasswordInput from "@/components/ui/password-input";
import AuthSplitLayout from "./AuthSplitLayout";

// ── Form (needs Suspense boundary because of useSearchParams) ─────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const { user } = useAuth.getState();
      if (!user) return;
      const redirect = searchParams.get("redirect");
      if (redirect && user.role === "Customer") { router.push(redirect); return; }
      const roleRoutes: Record<string, string> = {
        Admin: "/admin", Merchant: "/merchant", Courier: "/courier", Customer: "/",
      };
      router.push(roleRoutes[user.role] ?? "/");
    } catch {}
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-9">
        <h1
          className="leading-tight mb-2"
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "clamp(1.875rem, 4vw, 2.5rem)",
            fontWeight:    400,
            color:         "var(--charcoal)",
            letterSpacing: "-0.025em",
          }}
        >
          Welcome back.
        </h1>
        <p style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)", fontSize: "0.9375rem" }}>
          Sign in to your BAZR account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error banner */}
        {error && (
          <div className="px-4 py-3.5 rounded-2xl text-[13px] font-medium animate-in fade-in slide-in-from-top-1"
            style={{ background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.15)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-[2px]"
            style={{ color: "var(--charcoal-soft)" }}>
            Email Address
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            required
            placeholder="you@example.com"
            className="h-12 rounded-xl bg-white transition-all border-(--border-mid) focus:border-(--charcoal) focus:ring-0"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-bold uppercase tracking-[2px]"
              style={{ color: "var(--charcoal-soft)" }}>
              Password
            </Label>
            <Link href="/auth/forgot-password"
              className="text-[11px] font-bold uppercase tracking-[2px] transition-colors hover:text-(--red)"
              style={{ color: "var(--charcoal-soft)" }}>
              Forgot?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            required
            placeholder="••••••••"
            className="h-12 rounded-xl bg-white transition-all border-(--border-mid) focus:border-(--charcoal) focus:ring-0"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-13 rounded-2xl font-bold text-sm uppercase tracking-[1.5px] transition-all group mt-2 shadow-sm"
          style={{ background: "var(--charcoal)", color: "#fff" }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-8 pt-7 space-y-2.5"
        style={{ borderTop: "1px solid rgba(51,51,51,0.07)" }}>
        <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register"
            className="font-bold transition-colors hover:text-(--red) inline-flex items-center gap-1 group"
            style={{ color: "var(--charcoal)" }}>
            Create one free
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
        <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
          Want to sell?{" "}
          <Link href="/auth/apply-merchant"
            className="font-bold transition-colors hover:text-(--red) inline-flex items-center gap-1 group"
            style={{ color: "var(--charcoal)" }}>
            Become a Merchant
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <AuthSplitLayout variant="login">
      <Suspense
        fallback={
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-(--off-white-2) animate-pulse" />
            ))}
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
