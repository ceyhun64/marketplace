"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";

// ── Typed helper for Axios-shaped errors ─────────────────────────────────────

interface ApiError {
  response?: { status?: number };
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as ApiError)?.response?.status;
  // Allow ONE retry on 401: the Axios interceptor may have just refreshed
  // the token between the first attempt and the retry. After 1 retry, give up.
  if (status === 401) return failureCount < 1;
  // Never retry other 4xx client errors (except 429 Rate Limit)
  if (status !== undefined && status >= 400 && status < 500 && status !== 429) {
    return false;
  }
  return failureCount < 2;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Rehydrate the Zustand auth store synchronously before any query runs.
  // useRef ensures this executes exactly once during the first render, not in
  // a useEffect (which fires AFTER queries already started fetching).
  const rehydrated = useRef(false);
  if (!rehydrated.current && typeof window !== "undefined") {
    useAuth.persist.rehydrate();
    rehydrated.current = true;
  }

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30 s staleTime: data considered fresh for 30 s after fetch
            staleTime: 30_000,

            // 5 min gcTime: unused query data stays in memory for 5 minutes
            gcTime: 5 * 60_000,

            // 401: retry once (Axios interceptor may have refreshed the token)
            // Other 4xx: no retry. Network/5xx: up to 2 retries.
            retry: shouldRetry,

            // Mobile: switching app tabs must not spray the network
            refetchOnWindowFocus: false,

            // Show cached data while a background refetch runs
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 1,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
