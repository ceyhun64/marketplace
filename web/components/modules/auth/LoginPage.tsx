"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
    } catch {
      // Error is managed inside useAuth
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen  flex items-center justify-center p-6">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#C84B2F]/5 blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#1A4A6B]/5 blur-[120px]" />
        </div>

        <div className="w-full max-w-[440px] relative">
          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-black/[0.03] rounded-[40px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-bold text-black mb-2">
                Welcome Back
              </h1>
              <p className="text-[#7A7060] text-sm">
                Access your account to continue or{" "}
                <Link
                  href="/auth/register"
                  className="text-black font-bold hover:text-[#C84B2F] transition-colors underline decoration-black/10 underline-offset-4"
                >
                  create a new account.
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-14 rounded-2xl border-black/[0.05] bg-white/50 focus:bg-white focus:ring-black/5 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060]">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] font-bold text-[#7A7060] hover:text-black transition-colors uppercase tracking-wider"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-14 rounded-2xl border-black/[0.05] bg-white/50 focus:bg-white focus:ring-black/5 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-black hover:bg-[#C84B2F] text-white rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-all group"
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
          </div>

          {/* Footer Info */}
          <p className="mt-8 text-center text-[10px] text-[#7A7060] font-mono uppercase tracking-widest opacity-60">
            Secure login system &bull; 256-bit SSL Protection
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
