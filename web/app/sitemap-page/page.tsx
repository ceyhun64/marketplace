import SitemapPageComponent from "@/components/modules/sitemap/SitemapPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site Map — Marketplace",
  description: "A complete map of all pages on the Marketplace platform.",
};

export default function SitemapRoute() {
  return <SitemapPageComponent />;
}
