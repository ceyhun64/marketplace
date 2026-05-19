"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// ── Typed helper for Axios-shaped errors ─────────────────────────────────────

interface ApiError {
  response?: { status?: number };
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as ApiError)?.response?.status;
  // Never retry 4xx client errors (except 429 Rate Limit)
  if (status !== undefined && status >= 400 && status < 500 && status !== 429) {
    return false;
  }
  return failureCount < 2;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30 s staleTime: data considered fresh for 30 s after fetch
            staleTime: 30_000,

            // 5 min gcTime: unused query data stays in memory for 5 minutes
            // (previously cacheTime) — prevents ghost refetches on re-mount
            gcTime: 5 * 60_000,

            // Never retry 4xx; up to 2 retries for network/5xx errors
            retry: shouldRetry,

            // Mobile: switching app tabs must not spray the network with refetches
            refetchOnWindowFocus: false,

            // Show cached data immediately while a background refetch runs
            // This is the key setting that makes the UI feel instant
            networkMode: "offlineFirst",
          },
          mutations: {
            // 1 retry for mutations — avoids double-submission but handles flaky networks
            retry: 1,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  // Rehydrate persisted auth state on client mount
  useEffect(() => {
    useAuth.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
