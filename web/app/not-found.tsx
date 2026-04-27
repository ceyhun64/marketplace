"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  const { user } = useAuth();

  const homeHref =
    user?.role === "Admin"
      ? "/admin"
      : user?.role === "Merchant"
        ? "/merchant"
        : user?.role === "Courier"
          ? "/courier"
          : "/";

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex flex-col items-center justify-center px-6 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] right-[8%] w-[30%] h-[30%] rounded-full bg-[var(--red)]/4 blur-[120px]" />
        <div className="absolute bottom-[15%] left-[8%] w-[30%] h-[30%] rounded-full bg-[var(--charcoal-mid)]/4 blur-[120px]" />
      </div>

      {/* Big 404 */}
      <div className="relative select-none mb-2">
        <p
          className="text-[160px] md:text-[200px] font-['Cormorant_Garamond'] font-normal leading-none text-[var(--charcoal)] opacity-[0.04] tracking-[-0.05em]"
          aria-hidden="true"
        >
          404
        </p>
        {/* Centered label over 404 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[4px] text-[var(--red)] mb-3">
            Error 404
          </span>
          <h1 className="font-['Cormorant_Garamond'] text-[2.5rem] md:text-[3rem] font-normal text-[var(--charcoal)] tracking-[-0.02em] text-center leading-tight">
            Page Not Found
          </h1>
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-[var(--charcoal-soft)] text-center max-w-[340px] leading-relaxed mt-4 mb-10">
        The page you're looking for may have been moved, deleted, or never
        existed. Let's get you back on track.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          href={homeHref}
          className="h-12 px-7 bg-[var(--charcoal)] hover:bg-[var(--red)] text-white text-[13px] font-bold uppercase tracking-[2px] rounded-[12px] flex items-center gap-2 transition-all duration-[250ms] shadow-[var(--shadow-md)] group"
        >
          Back to Home
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-[250ms]" />
        </Link>

        <button
          onClick={() => typeof window !== "undefined" && window.history.back()}
          className="h-12 px-7 border-[1.5px] border-[var(--border-mid)] text-[var(--charcoal-soft)] text-[13px] font-semibold rounded-[12px] hover:border-[var(--charcoal)] hover:text-[var(--charcoal)] hover:bg-[var(--white)] transition-all duration-[250ms]"
        >
          ← Go Back
        </button>
      </div>

      {/* Footer note */}
      <p className="absolute bottom-8 text-[10px] text-[var(--charcoal-soft)] font-['JetBrains_Mono'] uppercase tracking-[3px] opacity-40">
        If you believe this is an error, please contact support
      </p>
    </div>
  );
}
