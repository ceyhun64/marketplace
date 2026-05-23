"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LockKeyhole, ArrowRight } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-(--bg-page) flex items-center justify-center px-6 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-(--red)/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-(--charcoal-mid)/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-115 relative">
        {/* Card */}
        <div className="bg-white border border-(--border-light) rounded-[40px] p-8 md:p-12 shadow-(--shadow-lg) text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-(--red-muted) border border-(--red-subtle) flex items-center justify-center mx-auto mb-6">
            <LockKeyhole className="w-7 h-7 text-(--red)" />
          </div>

          {/* Mono label */}
          <span className="font-mono text-[10px] uppercase tracking-[3px] text-(--red) mb-3 block">
            Error 403
          </span>

          <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
            Access Denied
          </h1>
          <p className="text-[13px] text-(--charcoal-soft) leading-relaxed mb-8 max-w-75 mx-auto">
            You don't have permission to access this page. Please sign in to
            your account to continue.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full h-14 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-(--shadow-md)">
              <Link href="/auth/login" className="flex items-center justify-center gap-2 group">
                Sign In
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full h-12 border-(--border-mid) text-(--charcoal-soft) text-[13px] font-semibold rounded-2xl hover:border-(--charcoal) hover:text-(--charcoal)">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>

          {/* Divider & Register */}
          <div className="mt-8 pt-6 border-t border-(--border-light)">
            <p className="text-[12px] text-(--charcoal-soft)">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-(--charcoal) font-bold hover:text-(--red) transition-colors inline-flex items-center gap-1 group"
              >
                Register now
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[3px] text-(--charcoal-soft) opacity-50">
          Your personal data is protected with 256-bit encryption
        </p>
      </div>
    </div>
  );
}
