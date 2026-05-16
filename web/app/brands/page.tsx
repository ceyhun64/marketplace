import BrandsPage from "@/components/modules/brands/BrandsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands — Marketplace",
  description:
    "Discover top brands and shop their official products on BAZR Marketplace.",
  openGraph: {
    title: "Brands — BAZR Marketplace",
    description: "Explore top brands and their official product catalogues.",
    type: "website",
  },
};

export default function BrandsRoute() {
  return <BrandsPage />;
}
