import { NextRequest, NextResponse } from "next/server";

// ── Yapılandırma ────────────────────────────────────────────────────────────
// yourplatform.com ile eşleşen ana host — bu domain'ler e-mağaza yönlendirmesi dışında tutulur
const MAIN_HOSTS = [
  "yourplatform.com",
  "www.yourplatform.com",
  "localhost",
];

// Wildcard subdomain desteği: xxx.yourplatform.com → /store/xxx
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "yourplatform.com";

const PROTECTED: Record<string, string[]> = {
  "/admin": ["Admin"],
  "/merchant": ["Merchant"],
  "/courier": ["Courier"],
  // Customer sayfaları — giriş yapmış herhangi bir rol erişebilir
  "/orders": ["Admin", "Merchant", "Courier", "Customer"],
  "/checkout": ["Admin", "Merchant", "Courier", "Customer"],
  "/profile": ["Admin", "Merchant", "Courier", "Customer"],
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
  const hostname = req.headers.get("host") ?? "";
  const hostWithoutPort = hostname.split(":")[0];

  // ── Custom Domain / Wildcard Subdomain → E-Mağaza Yönlendirmesi ──────────
  // Nginx X-Store-Slug header'ı gönderiyorsa (wildcard subdomain)
  const nginxSlug = req.headers.get("x-store-slug");
  if (nginxSlug && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/store/${nginxSlug}`;
    return NextResponse.rewrite(url);
  }

  // Wildcard subdomain: xxx.yourplatform.com → /store/xxx
  if (
    !MAIN_HOSTS.includes(hostWithoutPort) &&
    hostWithoutPort.endsWith(`.${PLATFORM_DOMAIN}`)
  ) {
    const slug = hostWithoutPort.replace(`.${PLATFORM_DOMAIN}`, "");
    // api, www gibi sistem subdomain'lerini dışla
    const EXCLUDED_SUBDOMAINS = ["api", "www", "admin", "mail", "cdn"];
    if (!EXCLUDED_SUBDOMAINS.includes(slug)) {
      const url = req.nextUrl.clone();
      url.pathname = `/store/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Özel domain: mycustomstore.com → backend'den slug eşlemesi gerekir.
  // Burada ana platform domaini olmayan ve subdomain pattern'e de uymayan
  // custom domainler için /store/[slug] rewrite yapılabilir.
  // Bu eşlemeyi yapmak için Next.js API route veya middleware fetch gerekir;
  // basit implementasyon: Nginx proxy_set_header X-Forwarded-Host ile yapılır.
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (
    forwardedHost &&
    !MAIN_HOSTS.includes(forwardedHost) &&
    !forwardedHost.endsWith(`.${PLATFORM_DOMAIN}`) &&
    forwardedHost !== PLATFORM_DOMAIN
  ) {
    // Custom domain: /store/... prefix ekle (slug backend'den alınmalı)
    // Şimdilik domain'i slug olarak kullanıyoruz; gerçek uygulamada DB lookup gerekir
    const url = req.nextUrl.clone();
    url.pathname = `/store/${forwardedHost}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Auth Guard ───────────────────────────────────────────────────────────
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
  matcher: [
    // E-mağaza custom domain/subdomain rewrite için tüm route'lar
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
