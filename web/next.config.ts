/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/duralbxt6/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },

  // ── Custom domain / subdomain desteği ────────────────────────────────────
  // Wildcard subdomain'lerin doğru yönlendirilmesi için gerekli
  async headers() {
    return [
      {
        // E-mağaza sayfaları için CDN cache kontrolü
        source: "/store/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },

  // Next.js 15+ → experimental.serverComponentsExternalPackages kaldırıldı,
  // üst seviyeye serverExternalPackages olarak taşındı
  serverExternalPackages: [],
};

module.exports = nextConfig;
