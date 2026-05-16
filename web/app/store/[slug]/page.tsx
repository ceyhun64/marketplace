
import type { Metadata } from "next";
import StorePage from "@/components/modules/store/StorePage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Gerçek uygulamada API'dan mağaza adı çekilebilir
  const storeName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${storeName} — Marketplace Store`,
    description: `Browse all products from ${storeName} on BAZR Marketplace. Verified seller with trusted ratings.`,
    openGraph: {
      title: `${storeName} — Marketplace Store`,
      description: `Shop from ${storeName} on BAZR Marketplace.`,
      type: "website",
    },
  };
}

export default function StoreRoute() {
  return <StorePage />;
}
