// app/blog/[slug]/page.tsx
import BlogDetailPage from "@/components/modules/blog/BlogDetailPage";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Blog — Marketplace`,
    description:
      "Read tips, guides, and platform updates from BAZR Marketplace.",
  };
}

export default function BlogDetailRoute({ params }: Props) {
  return <BlogDetailPage slug={params.slug} />;
}
