import { type NextRequest, NextResponse } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

// COOKIE_DOMAIN controls cross-subdomain sharing.
//
// Scenario A — Same origin (most common for Docker/Vercel):
//   Next.js: bazr.com   API: bazr.com/api  → COOKIE_DOMAIN not needed
//
// Scenario B — Separate subdomains:
//   Next.js: bazr.com   API: api.bazr.com
//   Set COOKIE_DOMAIN=.bazr.com so cookies are sent to both subdomains.
//   The leading dot is required by the cookie spec for subdomain matching.
//
// Leave COOKIE_DOMAIN unset in development (localhost ignores Domain).
const COOKIE_DOMAIN = IS_PROD ? (process.env.COOKIE_DOMAIN ?? undefined) : undefined;

/**
 * POST /api/auth/set-tokens
 *
 * Receives { accessToken, refreshToken } in the JSON body and stores them
 * as httpOnly cookies so that client-side JavaScript can never read them
 * directly, eliminating the XSS token-theft vector.
 *
 * Called by use-auth.ts immediately after a successful login / token refresh.
 */
export async function POST(req: NextRequest) {
  const { accessToken, refreshToken } = await req.json();

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Missing tokens." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  const cookieBase = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax" as const,
    path:     "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };

  // access_token: short-lived (1 day)
  res.cookies.set("access_token", accessToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 24,
  });

  // refresh_token: long-lived (7 days)
  res.cookies.set("refresh_token", refreshToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

/**
 * DELETE /api/auth/set-tokens
 *
 * Clears both auth cookies server-side on logout.
 * Client JS cannot clear httpOnly cookies directly, so this route is required.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });

  const expired = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   0,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
  res.cookies.set("access_token",  "", expired);
  res.cookies.set("refresh_token", "", expired);

  return res;
}
