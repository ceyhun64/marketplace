import type { NextConfig } from "next";

const IS_PROD = process.env.NODE_ENV === "production";

// ── Content Security Policy ───────────────────────────────────────────────────
//
// WHY script-src differs between dev and prod
// ───────────────────────────────────────────
// Next.js / Turbopack in development mode injects:
//   • __NEXT_DATA__ inline <script> block on every page
//   • Hot Module Replacement (HMR) inline event handlers
//   • Fast-refresh runtime inline scripts
//   • Error overlay bootstrapper scripts
//
// None of these carry a cryptographic hash, so the browser blocks them under a
// strict script-src that only allows 'self' — causing the
// "InvariantError: Expected a request ID to be defined" chain failure.
//
// In PRODUCTION Next.js emits no inline scripts; all runtime JS is in external
// files served from /_next/static/, so 'unsafe-inline' is NOT needed there.
// The production policy intentionally omits it.

// Development: relaxed to allow Turbopack / HMR inline scripts.
const devScriptSrc =
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com";

// Production: strict — only same-origin files + Stripe.js.
const prodScriptSrc =
  "script-src 'self' https://js.stripe.com";

const cspDirectives = [
  "default-src 'self'",
  IS_PROD ? prodScriptSrc : devScriptSrc,
  // Styles: unsafe-inline is required by Tailwind + Shadcn (CSS-in-JS class generation)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com data:",
  // Images: self + Cloudinary CDN + placeholder services
  "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co https://images.unsplash.com",
  // Connections: API backend + Stripe + SignalR (wss)
  // In dev, also allow localhost variants for HMR websocket
  `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ""} https://api.stripe.com wss:${IS_PROD ? "" : " ws: http://localhost:* ws://localhost:*"}`,
  // Frames: only Stripe payment frame is allowed
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  // Workers: blob: needed by some chart libs
  "worker-src 'self' blob:",
  // Block all object/embed (Flash, plugins)
  "object-src 'none'",
  // Upgrade insecure requests in production only
  ...(IS_PROD ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  // CSP — primary XSS defence
  { key: "Content-Security-Policy",          value: cspDirectives },
  // HSTS — enforced via Nginx in production, set here as defence-in-depth
  { key: "Strict-Transport-Security",        value: "max-age=63072000; includeSubDomains; preload" },
  // Clickjacking protection
  { key: "X-Frame-Options",                  value: "DENY" },
  // MIME-type sniffing protection
  { key: "X-Content-Type-Options",           value: "nosniff" },
  // Referrer: only send origin on same-origin requests
  { key: "Referrer-Policy",                  value: "strict-origin-when-cross-origin" },
  // Disable potentially invasive browser features
  { key: "Permissions-Policy",               value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  // DNS prefetch control
  { key: "X-DNS-Prefetch-Control",           value: "on" },
];

const nextConfig: NextConfig = {
  // Required for the Docker multi-stage build (web/Dockerfile copies .next/standalone).
  // Without this flag the standalone directory is not generated and the container fails.
  output: "standalone",

  images: {
    // SVG is kept but sandboxed — never executed as a script.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/duralbxt6/**",
      },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // Formats: prefer avif, then webp, then original
    formats: ["image/avif", "image/webp"],
    // Minimum cache TTL for optimised images (7 days)
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  async headers() {
    return [
      // ── Global security headers ────────────────────────────────────────────
      {
        source: "/(.*)",
        headers: securityHeaders,
      },

      // ── Next.js static assets — long immutable cache ───────────────────────
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // ── Public assets ──────────────────────────────────────────────────────
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },

      // ── E-Store pages — shared CDN cache for ISR content ──────────────────
      {
        source: "/store/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },

      // ── API routes — never cache auth / upload handlers ────────────────────
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },

  // Redirect http → https at Next.js level (Nginx handles it too; this is defence-in-depth)
  async redirects() {
    if (!IS_PROD) return [];
    return []; // Nginx handles the redirect; leave empty to avoid double-redirect
  },

  // Bundle optimisation
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
