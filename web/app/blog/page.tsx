import BlogPage from "@/components/modules/blog/BlogPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Marketplace",
  description:
    "Tips, platform updates, and guides for sellers and buyers on BAZR Marketplace.",
  openGraph: {
    title: "BAZR Marketplace Blog",
    description:
      "Seller tips, buyer guides, and platform updates from BAZR Marketplace.",
    type: "website",
  },
};

export default function BlogRoute() {
  return <BlogPage />;
}
