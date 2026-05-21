"use client";

// app/error.tsx — Application-wide error boundary (Next.js App Router)
// Catches unexpected runtime errors and presents a user-friendly interface.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log to console in all environments for debugging.
    // In production, replace this with your error tracking service:
    //   import * as Sentry from "@sentry/nextjs";
    //   Sentry.captureException(error);
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            An unexpected error occurred. Please try refreshing the page or
            return to the home page.
          </p>
        </div>

        {/* Error detail (development environment only) */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="default"
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home Page
          </Button>
        </div>

        {/* Support link */}
        <p className="text-xs text-muted-foreground">
          If the problem persists,{" "}
          <a
            href="/contact"
            className="underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-0.5"
          >
            contact our support team
            <ChevronRight className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
