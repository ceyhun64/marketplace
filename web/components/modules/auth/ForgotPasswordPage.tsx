"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-(--red)/5 blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-(--charcoal-mid)/5 blur-[100px]" />
        </div>

        <div className="w-full max-w-115 relative text-center">
          <div className="bg-white border border-(--border-light) rounded-[40px] p-10 md:p-14 shadow-(--shadow-lg)">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-(--red-muted) border border-(--red-subtle) flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-(--red)" />
            </div>

            <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
              Check Your Inbox
            </h1>
            <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8">
              We sent a password reset link to{" "}
              <span className="font-bold text-(--charcoal)">{email}</span>.
              Please check your inbox and follow the instructions.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full h-12 rounded-xl border-(--border-mid) text-(--charcoal) font-semibold text-[13px] hover:border-(--charcoal) hover:bg-(--bg-page)"
              >
                Try a Different Email
              </Button>
              <Button variant="ghost" asChild className="w-full h-12 text-(--charcoal-soft) text-[13px] font-medium hover:text-(--charcoal)">
                <Link href="/auth/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[3px] text-(--charcoal-soft) opacity-50">
            Link expires in 15 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-page) flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-(--red)/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-(--charcoal-mid)/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-115 relative">
        {/* Back Link */}
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 text-[13px] text-(--charcoal-soft) hover:text-(--charcoal) mb-8 font-medium transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="bg-white border border-(--border-light) rounded-[40px] p-8 md:p-12 shadow-(--shadow-lg)">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-(--red-muted) border border-(--red-subtle) flex items-center justify-center mb-6">
            <Mail className="w-5 h-5 text-(--red)" />
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-2 tracking-tight">
              Forgot Password
            </h1>
            <p className="text-[13px] text-(--charcoal-soft) leading-relaxed">
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
              <label className="label-mono ml-1">Email Address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                autoComplete="email"
                autoFocus
                className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending || !email}
              className="w-full h-14 bg-(--charcoal) hover:bg-(--red) disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md) mt-2 flex items-center justify-center gap-2 group"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[3px] text-(--charcoal-soft) opacity-50">
          Your personal data is protected with 256-bit encryption
        </p>
      </div>
    </div>
  );
}
