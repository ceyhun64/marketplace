"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-12">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[var(--red)]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-[var(--charcoal-mid)]/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-[460px] relative">
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-black/[0.03] rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-heading font-normal text-[var(--charcoal)] mb-3">
              Welcome Back
            </h1>
            <p className="text-[var(--charcoal-soft)] text-sm">
              Sign in to continue your premium shopping experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                required
                placeholder="example@mail.com"
                className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 mr-1">
                <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)]">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] hover:text-[var(--red)] transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                required
                placeholder="••••••••"
                className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[var(--charcoal)] hover:bg-[var(--red)] text-white rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-all group mt-4 shadow-lg shadow-black/5"
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

          <div className="mt-8 pt-8 border-t border-black/[0.03] text-center space-y-3">
            <p className="text-sm text-[var(--charcoal-soft)]">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-[var(--charcoal)] font-bold hover:text-[var(--red)] transition-colors inline-flex items-center gap-1 group"
              >
                Register
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
            <p className="text-sm text-[var(--charcoal-soft)]">
              Want to sell on our platform?{" "}
              <Link
                href="/auth/apply-merchant"
                className="text-[var(--charcoal)] font-bold hover:text-[var(--red)] transition-colors inline-flex items-center gap-1 group"
              >
                Become a Merchant
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[var(--charcoal-soft)] font-mono uppercase tracking-[3px] opacity-50">
          Your personal data is protected with 256-bit encryption
        </p>
      </div>
    </div>
  );
}
