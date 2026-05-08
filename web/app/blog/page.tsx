import BlogPage from "@/components/modules/blog/BlogPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Marketplace",
  description:
    "Tips, platform updates, and guides for sellers and buyers on Marketplace.",
};

export default function BlogRoute() {
  return <BlogPage />;
}
