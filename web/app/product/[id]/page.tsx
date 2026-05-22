import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchISR } from "@/lib/fetch";
import ProductPage from "@/components/modules/product/ProductPage";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ id: string }>;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  stock: number;
  category?: { name: string; slug: string };
  merchant?: { storeName: string };
  averageRating?: number;
  reviewCount?: number;
}

// ── Dynamic metadata for SEO + Open Graph ─────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchISR<ProductData>(`/api/products/${id}`, { revalidate: 30 });

  if (!product) return { title: "Product Not Found" };

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
    alternates: { canonical: `/product/${id}` },
  };
}

// ── Page component ─────────────────────────────────────────────────────────────
export default async function ProductRoute({ params }: Props) {
  const { id }    = await params;
  const product   = await fetchISR<ProductData>(`/api/products/${id}`);
  if (!product) notFound();

  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bazr.com";
  const pageUrl  = `${siteUrl}/product/${id}`;

  const breadcrumbs = [
    { name: "Home",     url: siteUrl },
    ...(product.category
      ? [{ name: product.category.name, url: `${siteUrl}/category/${product.category.slug}` }]
      : []),
    { name: product.name, url: pageUrl },
  ];

  return (
    <>
      {/* Google Product rich result */}
      <ProductJsonLd
        id={pageUrl}
        name={product.name}
        description={product.description}
        image={product.images}
        price={product.price}
        currency="USD"
        availability={product.stock > 0 ? "InStock" : "OutOfStock"}
        brand={product.merchant?.storeName}
        ratingValue={product.averageRating}
        reviewCount={product.reviewCount}
        url={pageUrl}
      />

      {/* Breadcrumb path in SERP */}
      <BreadcrumbJsonLd items={breadcrumbs} />

      <ProductPage />
    </>
  );
}
