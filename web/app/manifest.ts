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
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Search Products",
        short_name: "Search",
        description: "Search for products across all sellers",
        url: "/search",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "View and track your orders",
        url: "/orders",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Today's Deals",
        short_name: "Deals",
        description: "Browse today's best deals",
        url: "/deals",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Home page showing featured products",
      },
    ],
  };
}
