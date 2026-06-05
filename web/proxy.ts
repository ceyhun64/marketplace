import { NextRequest, NextResponse } from "next/server";

// ── Yapılandırma ─────────────────────────────────────────────────────────────
const PLATFORM_DOMAIN =
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "yourplatform.com";

// Bu host'lar asla e-mağaza rewrite'ına girmez
const MAIN_HOSTS = new Set([
  "yourplatform.com",
  "www.yourplatform.com",
  "localhost",
  "127.0.0.1",
  "::1",
  PLATFORM_DOMAIN,
]);

// /store/[slug] rewrite'ından muaf sistem subdomain'leri
const EXCLUDED_SUBDOMAINS = new Set([
  "api",
  "www",
  "admin",
  "mail",
  "cdn",
  "assets",
]);

const PROTECTED: Record<string, string[]> = {
  "/admin": ["Admin"],
  "/merchant": ["Merchant"],
  "/courier": ["Courier"],
  "/orders": ["Admin", "Merchant", "Courier", "Customer"],
  "/checkout": ["Admin", "Merchant", "Courier", "Customer"],
  "/profile": ["Admin", "Merchant", "Courier", "Customer"],
};

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

/** Port'u ve protokolü at: "localhost:3000" → "localhost" */
function stripPort(host: string): string {
  return host.split(":")[0].toLowerCase();
}

/** Verilen host production platform domain'i mi, yoksa localhost/dev ortamı mı? */
function isMainHost(host: string): boolean {
  const bare = stripPort(host);
  if (MAIN_HOSTS.has(bare)) return true;
  // localhost'un IPv4/IPv6 varyantları
  if (bare === "127.0.0.1" || bare === "::1") return true;
  // .local, .test, .localhost gibi dev TLD'leri
  if (
    bare.endsWith(".localhost") ||
    bare.endsWith(".local") ||
    bare.endsWith(".test")
  )
    return true;
  // Vercel preview/production URL'leri
  if (bare.endsWith(".vercel.app")) return true;
  return false;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rawHost = req.headers.get("host") ?? "";

  // ── Nginx X-Store-Slug header (wildcard subdomain proxy'den gelir) ────────
  const nginxSlug = req.headers.get("x-store-slug");
  if (nginxSlug && !EXCLUDED_SUBDOMAINS.has(nginxSlug)) {
    const url = req.nextUrl.clone();
    url.pathname = `/store/${nginxSlug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Wildcard subdomain: xxx.yourplatform.com → /store/xxx ────────────────
  const bareHost = stripPort(rawHost);
  if (!isMainHost(rawHost) && bareHost.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const slug = bareHost.slice(0, -(PLATFORM_DOMAIN.length + 1));
    if (slug && !EXCLUDED_SUBDOMAINS.has(slug)) {
      const url = req.nextUrl.clone();
      url.pathname = `/store/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Özel domain (X-Forwarded-Host Nginx'ten geliyorsa ve gerçek custom domain'se) ──
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const bareForwarded = stripPort(forwardedHost);
    const isCustomDomain =
      !isMainHost(forwardedHost) &&
      !bareForwarded.endsWith(`.${PLATFORM_DOMAIN}`) &&
      bareForwarded !== PLATFORM_DOMAIN;

    if (isCustomDomain) {
      const url = req.nextUrl.clone();
      url.pathname = `/store/${bareForwarded}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Auth Guard ────────────────────────────────────────────────────────────
  // Use exact path-segment matching: prefix must be followed by "/" or end of
  // string so that "/merchant" does not accidentally match "/merchants/...".
  const matchedPrefix = Object.keys(PROTECTED).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  if (!matchedPrefix) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
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
  matcher: [
    // Exclude: Next.js internals, favicon, and public static media (merchants, products, images)
    "/((?!_next/static|_next/image|favicon\\.ico|merchants/|products/|images/).*)",
  ],
};
