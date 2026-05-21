// app/manifest.ts — Progressive Web App manifest
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BAZR — Marketplace & Fulfillment",
    short_name: "BAZR",
    description:
      "Multi-tenant marketplace with integrated courier fulfillment. Thousands of sellers, one platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#1a1a1a",
    orientation: "portrait-primary",
    categories: ["shopping", "business"],
    lang: "en",
    // NOTE: SVG icons serve as brand placeholders during development.
    // Before launching to production, replace these with properly exported
    // PNG files (192×192 and 512×512) generated from the final brand assets.
    // Recommended tool: https://realfavicongenerator.net
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Search Products",
        short_name: "Search",
        description: "Search for products across all sellers",
        url: "/search",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "View and track your orders",
        url: "/orders",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
      {
        name: "Today's Deals",
        short_name: "Deals",
        description: "Browse today's best deals",
        url: "/deals",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
    ],
    // Screenshot silindi — gerçek ekran görüntüsü olmadan 404 üretiyordu.
    // Production'a geçmeden önce app store benzeri bir tanıtım ekranı ekleyin.
  };
}
