// web/lib/fetch.ts
// For use in Server Components and Route Handlers only.
// DO NOT import this file in Client Components.

// API_INTERNAL_URL is a server-only variable (no NEXT_PUBLIC_ prefix).
// It is never included in the browser bundle and may point to an internal
// network address (e.g. http://api:5010 in Docker / Kubernetes).
// Fall back to NEXT_PUBLIC_API_URL for local development convenience.
const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5010";

type FetchOptions = RequestInit & {
  revalidate?: number | false;
  tags?: string[];
};

/**
 * ISR fetch — for static pages (category list, product list, etc.)
 * revalidate: 60 → revalidates in the background every 60 seconds
 */
export async function fetchISR<T>(
  path: string,
  options?: FetchOptions,
): Promise<T | null> {
  const { revalidate = 60, tags, ...rest } = options ?? {};

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      next: {
        revalidate,
        ...(tags ? { tags } : {}),
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Fetch ISR failed: ${res.status} ${path}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[fetchISR] ${path}`, err);
    return null;
  }
}

/**
 * SSR fetch — for pages that need fresh data on every request
 * (order detail, profile, admin panel, etc.)
 */
export async function fetchSSR<T>(
  path: string,
  token?: string,
  options?: RequestInit,
): Promise<T | null> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      // 404 → return null, do not throw
      if (res.status === 404) return null;
      throw new Error(`Fetch SSR failed: ${res.status} ${path}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    // Network error or JSON parse error
    console.error(`[fetchSSR] ${path}`, err);
    return null;
  }
}

/**
 * Static fetch — for data that never changes (plan list, plugin list, etc.)
 * Fetched once at build time.
 */
export async function fetchStatic<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    throw new Error(`Fetch Static failed: ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Server Fetch Helper — for store and product data
 */
export const serverFetch = {
  product: (id: string) => fetchISR(`/api/products/${id}`),
  store: (slug: string) => fetchISR(`/api/store/${slug}`),
  storeProducts: (slug: string) => fetchISR(`/api/store/${slug}/products`),
};
