"use client";

import { useState, Suspense, type SyntheticEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import PasswordInput from "@/components/ui/password-input";
import AuthSplitLayout from "./AuthSplitLayout";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    try {
      const user = await login(email, password);
      const redirect = searchParams.get("redirect");
      const roleRoot: Record<string, string> = {
        Admin: "/admin", Merchant: "/merchant", Courier: "/courier", Customer: "/",
      };
      const home = roleRoot[user.role] ?? "/";
      if (redirect && redirect.startsWith(home)) {
        router.push(redirect);
      } else {
        router.push(home);
      }
    } catch {
      // Error is already set in the Zustand store by login()
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-9">
        <h1
          className="font-heading leading-tight mb-2 text-(--charcoal)"
          style={{ fontSize: "clamp(1.875rem, 4vw, 2.375rem)", fontWeight: 400, letterSpacing: "-0.025em" }}
        >
          Welcome back.
        </h1>
        <p className="text-[0.9375rem] text-(--charcoal-soft)">
          Sign in to your BAZR account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error banner */}
        {error && (
          <div className="px-4 py-3.5 rounded-2xl text-[13px] font-medium animate-in fade-in slide-in-from-top-1 bg-(--danger-bg) border border-(--danger-border) text-(--danger)">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label className="label-mono">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            required
            placeholder="you@example.com"
            className="h-12 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label-mono">Password</label>
            <Link
              href="/auth/forgot-password"
              className="label-mono hover:text-(--charcoal) transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            required
            placeholder="••••••••"
            className="h-12 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-[1.5px] transition-all group mt-2 bg-(--charcoal) hover:bg-(--red) text-white"
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
      <div className="mt-8 pt-7 space-y-2.5 border-t border-(--border-light)">
        <p className="text-sm text-(--charcoal-soft)">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-(--charcoal) hover:text-(--red) transition-colors inline-flex items-center gap-1 group"
          >
            Create one free
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
        <p className="text-sm text-(--charcoal-soft)">
          Want to sell?{" "}
          <Link
            href="/auth/apply-merchant"
            className="font-bold text-(--charcoal) hover:text-(--red) transition-colors inline-flex items-center gap-1 group"
          >
            Become a Merchant
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthSplitLayout variant="login">
      <Suspense
        fallback={
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl animate-pulse bg-(--border-light)"
              />
            ))}
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
