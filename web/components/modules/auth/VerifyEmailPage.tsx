"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, MailCheck } from "lucide-react";

type VerifyState = "loading" | "success" | "error" | "missing_token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<VerifyState>(
    token ? "loading" : "missing_token",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    api
      .post("/api/auth/verify-email", { token })
      .then(() => {
        setState("success");
        setTimeout(() => router.push("/auth/login"), 3500);
      })
      .catch((err: any) => {
        setErrorMessage(
          err?.response?.data?.message ??
            "This verification link is invalid or has expired.",
        );
        setState("error");
      });
  }, [token, router]);

  // ── Missing token ───────────────────────────────────────────────────────── //
  if (state === "missing_token") {
    return (
      <Card>
        <div className="text-5xl mb-6">🔗</div>
        <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
          Invalid Link
        </h1>
        <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8">
          No verification token was found. Please use the link from your
          registration email.
        </p>
        <Button
          asChild
          className="w-full h-14 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md)"
        >
          <Link href="/auth/register">Create Account</Link>
        </Button>
      </Card>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────── //
  if (state === "loading") {
    return (
      <Card>
        <div className="w-16 h-16 rounded-full bg-(--charcoal-subtle) flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-7 h-7 text-(--charcoal-soft) animate-spin" />
        </div>
        <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
          Verifying…
        </h1>
        <p className="text-[13px] text-(--charcoal-soft) leading-relaxed">
          Please wait while we verify your email address.
        </p>
      </Card>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────── //
  if (state === "error") {
    return (
      <Card>
        <div className="w-16 h-16 rounded-full bg-(--red-muted) border border-(--red-subtle) flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-7 h-7 text-(--red)" />
        </div>
        <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
          Verification Failed
        </h1>
        <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8">
          {errorMessage}
        </p>
        <div className="space-y-3">
          <Button
            asChild
            className="w-full h-14 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md)"
          >
            <Link href="/auth/register">Register Again</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-12 rounded-2xl text-[13px] font-medium"
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────── //
  return (
    <Card>
      <div className="w-16 h-16 rounded-full bg-(--red-muted) border border-(--red-subtle) flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-7 h-7 text-(--red)" />
      </div>
      <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
        Email Verified
      </h1>
      <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8">
        Your email address has been verified successfully. You'll be redirected
        to the login page shortly.
      </p>
      <Button
        asChild
        className="w-full h-14 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md)"
      >
        <Link href="/auth/login">Sign In Now</Link>
      </Button>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--bg-page) flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-(--red)/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-(--charcoal-mid)/5 blur-[100px]" />
      </div>
      <div className="w-full max-w-105 relative text-center">
        <div className="bg-white border border-(--border-light) rounded-[40px] p-10 md:p-14 shadow-(--shadow-lg)">
          {children}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-(--charcoal-soft) opacity-60">
          <MailCheck className="w-4 h-4" />
          <p className="font-mono text-[10px] uppercase tracking-[3px]">
            Email verification secured
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
