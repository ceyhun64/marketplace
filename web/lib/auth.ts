// lib/auth.ts — Token storage helpers (cookie-based, middleware uyumlu)

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

function setCookie(name: string, value: string, days = 7) {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // JWT zaten URL-safe karakterler içerir, encodeURIComponent KULLANMA
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  // indexOf ile böl — değerin içinde '=' (base64 padding) olabilir
  return match ? match.substring(match.indexOf("=") + 1) : null;
}

function deleteCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setCookie(ACCESS_TOKEN_KEY, accessToken, 1);
  setCookie(REFRESH_TOKEN_KEY, refreshToken, 7);
}

export function clearTokens(): void {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
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
    return JSON.parse(atob(token.split(".")[1])) as TokenPayload;
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
