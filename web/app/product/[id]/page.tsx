import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import ProductPage from "@/components/modules/product/ProductPage";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Dynamic metadata for SEO + Open Graph ─────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchISR<{
    name: string;
    description: string;
    images: string[];
    price: number;
  }>(`/api/products/${id}`, {
    // 30-second revalidation — keeps server-rendered price/stock
    // reasonably fresh. On-demand revalidation can be added later
    // via revalidateTag("product-{id}") when the merchant updates a product.
    revalidate: 30,
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title       = `${product.name} — BAZR Marketplace`;
  const description = product.description?.slice(0, 160) ?? title;
  const image       = product.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, width: 800, height: 800 }] } : {}),
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: {
      canonical: `/product/${id}`,
    },
  };
}

// ── Page component ─────────────────────────────────────────────────────────────
// ProductPage itself is "use client" — this thin server wrapper handles metadata
// and 404 routing before hydrating the client component.
export default async function ProductRoute({ params }: Props) {
  const { id } = await params;

  // Validate the product exists at the server level so Next.js returns a proper
  // 404 (not a client-side "product not found" state) — important for SEO.
  const product = await fetchISR(`/api/products/${id}`);
  if (!product) notFound();

  return <ProductPage />;
}
