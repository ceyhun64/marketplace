// lib/auth.ts — Token storage helpers
//
// STORAGE STRATEGY
// ────────────────
// Tokens are kept in TWO stores simultaneously:
//
//   1. Module-level variables (_accessToken / _refreshToken)
//      Instant reads with zero parsing overhead. Cleared on page refresh.
//
//   2. localStorage (keys: "access_token" / "refresh_token")
//      Survives page refresh (F5). Read on first access when the
//      in-memory variable is null. Works reliably in the browser across
//      all modern environments — no SameSite / Secure / domain constraints.
//
// WHY NOT cookies?
//   Our backend is on a different origin (Render) from the frontend (Vercel).
//   We rely on the Authorization: Bearer header, not automatic cookie sending.
//   Regular (non-httpOnly) cookies have the same XSS exposure as localStorage,
//   but are harder to read reliably after F5 in cross-origin deployments
//   (SameSite policies, Secure flag timing, path mismatches).
//   localStorage is simpler, predictable, and sufficient for this architecture.

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ── In-memory cache (primary — zero-latency reads within the same session) ───

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the access token — memory first, then localStorage fallback.
 * The localStorage path is taken once per page load (F5), after which the
 * in-memory variable is warm for the rest of the session.
 */
export function getAccessToken(): string | null {
  if (_accessToken) return _accessToken;
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (stored) _accessToken = stored; // warm the cache for subsequent calls
  return stored;
}

/** Returns the refresh token — memory first, then localStorage fallback. */
export function getRefreshToken(): string | null {
  if (_refreshToken) return _refreshToken;
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (stored) _refreshToken = stored;
  return stored;
}

/**
 * Stores tokens in memory (immediate) AND in localStorage (page-refresh survival).
 * Guards against undefined/empty values — a corrupted token is worse than no token.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  // Guard: never persist empty or literal "undefined" strings.
  // This can happen if a caller receives a raw PascalCase API response
  // and accidentally passes undefined.
  if (!accessToken || !refreshToken) {
    console.warn("[auth] setTokens called with empty token(s) — ignoring.");
    return;
  }
  _accessToken = accessToken;
  _refreshToken = refreshToken;
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/** Clears tokens from both memory and localStorage. */
export async function clearTokens(): Promise<void> {
  _accessToken = null;
  _refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
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
  sub: string;
  email: string;
  role?: "Admin" | "Merchant" | "Courier" | "Customer";
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  merchantId?: string;
  exp: number;
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
