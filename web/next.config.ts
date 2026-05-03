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

  // Nginx'ten gelen x-store-slug header'ını Next.js'e ilet
  // Bu, wildcard SSL + subdomain yönlendirme için kritiktir
  experimental: {
    // Server Components'in harici API çağrılarına izin ver
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
