"use client";

// app/admin/error.tsx — Admin panel hata sınırı
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-[var(--red-muted)] flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-[var(--red)]" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Something went wrong
        </h2>
        <p className="text-[var(--text-secondary)] text-sm max-w-sm">
          An error occurred in the admin panel. Please try again or contact
          engineering if the issue persists.
        </p>
        {process.env.NODE_ENV === "development" && error?.message && (
          <p className="mt-3 text-xs font-mono text-[var(--red)] bg-[var(--red-muted)] rounded-lg p-3 text-left max-w-md">
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--charcoal)] text-white text-sm font-semibold hover:bg-[var(--charcoal-2)] transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
