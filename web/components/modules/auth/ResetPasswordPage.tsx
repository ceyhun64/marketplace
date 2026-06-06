"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import PasswordInput from "@/components/ui/password-input";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => {
      const res = await api.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Password reset failed. The link may be invalid or expired.",
      );
    },
  });

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 8)
      return { level: "weak",   label: "Weak",   color: "var(--red)",     count: 1 };
    if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd))
      return { level: "medium", label: "Medium", color: "var(--warning)", count: 2 };
    return   { level: "strong", label: "Strong", color: "var(--success)", count: 3 };
  };

  const strength = passwordStrength(form.password);

  /* -- Invalid Token --------------------------------------- */
  if (!token) {
    return (
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-(--red)/5 blur-[100px]" />
        </div>

        <div className="w-full max-w-105 relative text-center">
          <div className="bg-white border border-(--border-light) rounded-[40px] p-10 md:p-14 shadow-(--shadow-lg)">
            <div className="text-5xl mb-6">🔗</div>
            <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
              Invalid Link
            </h1>
            <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <Button asChild className="w-full h-14 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md)">
              <Link href="/auth/forgot-password">Request New Link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* -- Success --------------------------------------------- */
  if (done) {
    return (
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-(--red)/5 blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-(--charcoal-mid)/5 blur-[100px]" />
        </div>

        <div className="w-full max-w-115 relative text-center">
          <div className="bg-white border border-(--border-light) rounded-[40px] p-10 md:p-14 shadow-(--shadow-lg)">
            <div className="w-16 h-16 rounded-full bg-(--red-muted) border border-(--red-subtle) flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-(--red)" />
            </div>
            <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
              Password Updated
            </h1>
            <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8">
              Your password has been updated successfully. You'll be redirected
              to the login page shortly.
            </p>
            <Button asChild className="w-full h-14 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md)">
              <Link href="/auth/login">Sign In Now</Link>
            </Button>
          </div>

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[3px] text-(--charcoal-soft) opacity-50">
            Your personal data is protected with 256-bit encryption
          </p>
        </div>
      </div>
    );
  }

  /* -- Main Form ------------------------------------------- */
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
            <KeyRound className="w-5 h-5 text-(--red)" />
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-2 tracking-tight">
              Set New Password
            </h1>
            <p className="text-[13px] text-(--charcoal-soft) leading-relaxed">
              Choose a strong password — at least 8 characters with an uppercase
              letter and a number.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.password !== form.confirm) {
                toast.error("Passwords do not match");
                return;
              }
              if (form.password.length < 8) {
                toast.error("Password must be at least 8 characters");
                return;
              }
              mutation.mutate({ token, newPassword: form.password });
            }}
            className="space-y-5"
          >
            {/* New Password */}
            <div className="space-y-2">
              <label className="label-mono ml-1">New Password</label>
              <PasswordInput
                id="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="••••••••"
                required
                className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
              />

              {/* Strength Indicator */}
              {strength && (
                <div className="space-y-1.5 px-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-200"
                        style={{ background: i <= strength.count ? strength.color : "var(--border-mid)" }}
                      />
                    ))}
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[1px] text-(--charcoal-soft)">
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="label-mono ml-1">Confirm Password</label>
              <PasswordInput
                id="confirm"
                value={form.confirm}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, confirm: e.target.value }))
                }
                placeholder="••••••••"
                required
                className={`h-12 rounded-xl bg-white focus:ring-0 transition-all ${
                  form.confirm && form.password !== form.confirm
                    ? "border-(--red) focus-visible:ring-(--red)/20"
                    : "border-(--border-light) focus:border-(--charcoal)"
                }`}
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-[11px] text-(--red) font-medium px-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !form.password ||
                !form.confirm ||
                form.password !== form.confirm
              }
              className="w-full h-14 bg-(--charcoal) hover:bg-(--red) disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md) mt-2 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update Password"
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--bg-page) flex items-center justify-center">
          <div className="animate-pulse text-(--charcoal-soft) font-mono text-xs uppercase tracking-widest">
            Loading...
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
