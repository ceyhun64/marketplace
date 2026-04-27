"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post("/api/auth/forgot-password", { email });
      return res.data;
    },
    onSuccess: () => {
      setSent(true);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Request could not be sent",
      );
    },
  });

  if (sent) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center p-6">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-[var(--red)]/5 blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-[var(--charcoal-mid)]/5 blur-[100px]" />
        </div>

        <div className="w-full max-w-[460px] relative text-center">
          <div className="bg-white/80 backdrop-blur-xl border border-[var(--border-light)] rounded-[40px] p-10 md:p-14 shadow-[var(--shadow-lg)]">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--red-muted)] border border-[var(--red-subtle)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-[var(--red)]" />
            </div>

            <h1 className="font-['Cormorant_Garamond'] text-[2rem] font-normal text-[var(--charcoal)] mb-3 tracking-[-0.01em]">
              Check Your Inbox
            </h1>
            <p className="text-[13px] text-[var(--charcoal-soft)] leading-relaxed mb-8">
              We sent a password reset link to{" "}
              <span className="font-bold text-[var(--charcoal)]">{email}</span>.
              Please check your inbox and follow the instructions.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="w-full h-12 rounded-[12px] border-[1.5px] border-[var(--border-mid)] text-[var(--charcoal)] text-[13px] font-semibold tracking-[0.03em] hover:border-[var(--charcoal)] hover:bg-[var(--off-white)] transition-all duration-[250ms]"
              >
                Try a Different Email
              </button>
              <Link href="/auth/login">
                <button className="w-full h-12 rounded-[12px] text-[var(--charcoal-soft)] text-[13px] font-medium flex items-center justify-center gap-2 hover:text-[var(--charcoal)] transition-colors duration-[250ms]">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </button>
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] text-[var(--charcoal-soft)] font-['JetBrains_Mono'] uppercase tracking-[3px] opacity-50">
            Link expires in 15 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center p-6">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-[var(--red)]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-[var(--charcoal-mid)]/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-[460px] relative">
        {/* Back Link */}
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 text-[13px] text-[var(--charcoal-soft)] hover:text-[var(--charcoal)] mb-8 font-medium transition-colors duration-[250ms] group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-[250ms]" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-[var(--border-light)] rounded-[40px] p-8 md:p-12 shadow-[var(--shadow-lg)]">
          {/* Icon */}
          <div className="w-12 h-12 rounded-[16px] bg-[var(--red-muted)] border border-[var(--red-subtle)] flex items-center justify-center mb-6">
            <Mail className="w-5 h-5 text-[var(--red)]" />
          </div>

          <div className="mb-8">
            <h1 className="font-['Cormorant_Garamond'] text-[2rem] font-normal text-[var(--charcoal)] mb-2 tracking-[-0.01em]">
              Forgot Password
            </h1>
            <p className="text-[13px] text-[var(--charcoal-soft)] leading-relaxed">
              Enter your email address and we'll send you a secure reset link.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              mutation.mutate(email);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                autoComplete="email"
                autoFocus
                className="h-12 rounded-xl border-[var(--border-light)] bg-white/50 focus:bg-white transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending || !email}
              className="w-full h-14 bg-[var(--charcoal)] hover:bg-[var(--red)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[16px] font-bold text-[13px] uppercase tracking-[2px] transition-all duration-[250ms] shadow-[var(--shadow-md)] mt-2 flex items-center justify-center gap-2 group"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <span className="group-hover:translate-x-0.5 transition-transform duration-[250ms]">
                    →
                  </span>
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-[10px] text-[var(--charcoal-soft)] font-['JetBrains_Mono'] uppercase tracking-[3px] opacity-50">
          Your personal data is protected with 256-bit encryption
        </p>
      </div>
    </div>
  );
}
