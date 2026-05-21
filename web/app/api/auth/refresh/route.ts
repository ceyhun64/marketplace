import { NextRequest, NextResponse } from "next/server";

// Use the server-only internal URL where available (never exposed to the browser).
const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5010";

/**
 * POST /api/auth/refresh
 *
 * Proxies the token refresh request to the .NET backend.
 * Reads the refresh_token from the httpOnly cookie (set by /api/auth/set-tokens)
 * and, on success, re-sets both tokens as new httpOnly cookies so the client
 * never handles raw JWT strings.
 */
export async function POST(req: NextRequest) {
  // Prefer reading from the httpOnly cookie; fall back to JSON body for
  // backward compatibility during the migration period.
  const cookieRefreshToken = req.cookies.get("refresh_token")?.value;

  let bodyRefreshToken: string | undefined;
  try {
    const body = await req.json();
    bodyRefreshToken = body?.refreshToken;
  } catch {
    // Body may be empty when called with cookie-only flow
  }

  const refreshToken = cookieRefreshToken ?? bodyRefreshToken;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Refresh token not found." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
      cache:   "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      // Propagate the backend error status (401 for expired, 403 for revoked, etc.)
      return NextResponse.json(data, { status: response.status });
    }

    const { accessToken, refreshToken: newRefreshToken } = data;
    const IS_PROD = process.env.NODE_ENV === "production";

    const res = NextResponse.json({
      // Return the access token so Axios interceptors can update the
      // in-memory token for the current request chain.
      accessToken,
      expiresAt: data.expiresAt,
    });

    // Re-set both tokens as httpOnly cookies
    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure:   IS_PROD,
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24,
    });

    if (newRefreshToken) {
      res.cookies.set("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure:   IS_PROD,
        sameSite: "lax",
        path:     "/",
        maxAge:   60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch {
    return NextResponse.json(
      { message: "Token refresh failed. Please sign in again." },
      { status: 500 },
    );
  }
}
