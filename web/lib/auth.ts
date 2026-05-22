// lib/auth.ts — Token storage helpers
//
// STORAGE STRATEGY
// ────────────────
// Tokens live in TWO places simultaneously:
//
//   1. Module-level variables (_accessToken / _refreshToken)
//      → Instant reads, no cookie parsing. Used by the Axios interceptor
//        during the same session. Cleared on page refresh.
//
//   2. Regular (non-httpOnly) cookies
//      → Survive page refresh. Fallback when the in-memory vars are null
//        (e.g. after SSR navigation or hard reload).
//
// httpOnly cookies are incompatible with this architecture: the access token
// must be readable by JavaScript to be placed in the Authorization header
// for cross-origin requests to the .NET backend.

const ACCESS_TOKEN_KEY  = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ── In-memory store (primary, cleared on page refresh) ───────────────────────

let _accessToken:  string | null = null;
let _refreshToken: string | null = null;

// ── Cookie helpers (secondary, survives refresh) ──────────────────────────────

function setCookie(name: string, value: string, days: number) {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.substring(name.length + 1));
}

function deleteCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns the access token — memory first, then cookie fallback. */
export function getAccessToken(): string | null {
  return _accessToken ?? getCookie(ACCESS_TOKEN_KEY);
}

/** Returns the refresh token — memory first, then cookie fallback. */
export function getRefreshToken(): string | null {
  return _refreshToken ?? getCookie(REFRESH_TOKEN_KEY);
}

/**
 * Stores tokens in memory (immediate) AND in cookies (page-refresh survival).
 * Kept async so existing callers (use-auth.ts) do not need to change.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  _accessToken  = accessToken;
  _refreshToken = refreshToken;
  setCookie(ACCESS_TOKEN_KEY,  accessToken,  1); // 1 day
  setCookie(REFRESH_TOKEN_KEY, refreshToken, 7); // 7 days
}

/**
 * Clears tokens from both memory and cookies.
 */
export async function clearTokens(): Promise<void> {
  _accessToken  = null;
  _refreshToken = null;
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

// ── JWT utilities ─────────────────────────────────────────────────────────────

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
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
