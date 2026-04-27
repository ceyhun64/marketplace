"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, ArrowRight } from "lucide-react";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center px-6 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[28%] h-[28%] rounded-full bg-[var(--red)]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[28%] h-[28%] rounded-full bg-[var(--charcoal-mid)]/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-[460px] relative">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-[var(--border-light)] rounded-[40px] p-8 md:p-12 shadow-[var(--shadow-lg)] text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[var(--red-muted)] border border-[var(--red-subtle)] flex items-center justify-center mx-auto mb-6">
            <LockKeyhole className="w-7 h-7 text-[var(--red)]" />
          </div>

          {/* Mono label */}
          <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[3px] text-[var(--red)] mb-3 block">
            Error 403
          </span>

          <h1 className="font-['Cormorant_Garamond'] text-[2rem] font-normal text-[var(--charcoal)] mb-3 tracking-[-0.01em]">
            Access Denied
          </h1>
          <p className="text-[13px] text-[var(--charcoal-soft)] leading-relaxed mb-8 max-w-[300px] mx-auto">
            You don't have permission to access this page. Please sign in to
            your account to continue.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full h-14 bg-[var(--charcoal)] hover:bg-[var(--red)] text-white rounded-[16px] font-bold text-[13px] uppercase tracking-[2px] transition-all duration-[250ms] shadow-[var(--shadow-md)] flex items-center justify-center gap-2 group"
            >
              Sign In
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-[250ms]" />
            </button>

            <Link href="/">
              <button className="w-full h-12 border-[1.5px] border-[var(--border-mid)] text-[var(--charcoal-soft)] text-[13px] font-semibold rounded-[16px] hover:border-[var(--charcoal)] hover:text-[var(--charcoal)] hover:bg-[var(--white)] transition-all duration-[250ms]">
                Back to Home
              </button>
            </Link>
          </div>

          {/* Divider & Register */}
          <div className="mt-8 pt-6 border-t border-[var(--border-light)]">
            <p className="text-[12px] text-[var(--charcoal-soft)]">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-[var(--charcoal)] font-bold hover:text-[var(--red)] transition-colors duration-[250ms] inline-flex items-center gap-1 group"
              >
                Register now
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-[250ms]" />
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[var(--charcoal-soft)] font-['JetBrains_Mono'] uppercase tracking-[3px] opacity-50">
          Your personal data is protected with 256-bit encryption
        </p>
      </div>
    </div>
  );
}
