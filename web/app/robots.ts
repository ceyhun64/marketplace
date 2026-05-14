// app/robots.ts — Next.js App Router robots.txt üreteci
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketplace.example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/merchant/",
          "/courier/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/profile/",
          "/wallet/",
          "/orders/",
          "/notifications/",
        ],
      },
      // Cloudinary görselleri bot dostu bırak
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
