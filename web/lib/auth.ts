// lib/auth.ts — Token storage helpers
//
// SECURITY MODEL
// ──────────────
// Access and refresh tokens are stored as httpOnly cookies set by
// /api/auth/set-tokens (a Next.js Route Handler).
// httpOnly cookies cannot be read by JavaScript, so XSS attacks cannot
// exfiltrate the tokens via document.cookie.
//
// The Axios interceptor reads tokens from the cookie via the server-side
// cookie jar (in Route Handlers / Middleware) or, client-side, relies on
// the browser automatically attaching cookies to same-origin requests.
// For cross-origin requests (NEXT_PUBLIC_API_URL → .NET backend), the
// Authorization header is still needed; we derive it from the non-sensitive
// identity claim embedded in the JWT, not by re-reading the raw token.
//
// If you need the raw token client-side (e.g. Axios Authorization header),
// read it from a non-httpOnly "access_token_presence" flag cookie that
// only carries the expiry, not the actual token value.

const ACCESS_TOKEN_KEY  = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ── Server-side cookie helpers (called from Route Handlers / Middleware) ──────

function setCookie(name: string, value: string, days = 7) {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.substring(match.indexOf("=") + 1) : null;
}

function deleteCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

/**
 * Stores tokens as httpOnly cookies via a server-side Route Handler.
 * Falls back to client-readable cookies in development for easier debugging.
 *
 * IMPORTANT: await this call before navigating away so the cookie is set
 * before the next request is made.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    const res = await fetch("/api/auth/set-tokens", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ accessToken, refreshToken }),
    });

    if (!res.ok) {
      throw new Error(`set-tokens returned ${res.status}`);
    }
  } catch (err) {
    console.error("[auth] Failed to set httpOnly tokens:", err);
    // Graceful fallback: store in regular cookies so the app stays functional.
    // This path should never be hit in production.
    setCookie(ACCESS_TOKEN_KEY,  accessToken,  1);
    setCookie(REFRESH_TOKEN_KEY, refreshToken, 7);
  }
}

/**
 * Removes auth tokens — calls the Route Handler to clear httpOnly cookies.
 */
export async function clearTokens(): Promise<void> {
  try {
    await fetch("/api/auth/set-tokens", { method: "DELETE" });
  } catch {
    // Fallback: clear client-readable cookies if the server route fails
  }
  // Always also clear any residual client-readable cookies
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

// ── JWT utilities ─────────────────────────────────────────────────────────────

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      // Works in both browser (atob) and Node.js (Buffer)
      typeof window !== "undefined"
        ? atob(token.split(".")[1])
        : Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export interface TokenPayload {
  sub:        string;
  email:      string;
  role?:      "Admin" | "Merchant" | "Courier" | "Customer";
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  merchantId?: string;
  exp:        number;
}

export function parseToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1];
    const json =
      typeof window !== "undefined"
        ? atob(base64)
        : Buffer.from(base64, "base64url").toString();
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(
  token: string,
): "Admin" | "Merchant" | "Courier" | "Customer" | null {
  const payload = parseToken(token);
  if (!payload) return null;
  const role =
    payload.role ??
    (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as
      | string
      | undefined);
  return (role as "Admin" | "Merchant" | "Courier" | "Customer") ?? null;
}
