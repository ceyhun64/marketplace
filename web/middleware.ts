import { NextRequest, NextResponse } from "next/server";

const PROTECTED: Record<string, string[]> = {
  "/admin": ["Admin"],
  "/merchant": ["Merchant"],
  "/courier": ["Courier"],
};

/**
 * .NET Identity JWT'de rol claim'i iki farklı key ile gelebilir:
 * 1. Kısa: "role"
 * 2. Uzun: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
 */
function parseJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload["role"] ??
      null
    );
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const matchedPrefix = Object.keys(PROTECTED).find((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!matchedPrefix) return NextResponse.next();

  // Token artık cookie'de — middleware bunu doğrudan okuyabilir
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = parseJwtRole(token);
  const allowed = PROTECTED[matchedPrefix];

  if (!role || !allowed.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/merchant/:path*", "/courier/:path*"],
};
