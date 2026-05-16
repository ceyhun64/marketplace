import CategoriesPage from "@/components/modules/categories/CategoriesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Categories — Marketplace",
  description:
    "Browse all product categories and subcategories on BAZR Marketplace.",
  openGraph: {
    title: "All Categories — BAZR Marketplace",
    description:
      "Explore every product category available on BAZR Marketplace.",
    type: "website",
  },
};

export default function CategoriesRoute() {
  return <CategoriesPage />;
}
