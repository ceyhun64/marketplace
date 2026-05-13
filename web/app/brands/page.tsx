import BrandsPage from "@/components/modules/brands/BrandsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands — Marketplace",
  description: "Discover top brands and their products.",
};

export default function BrandsRoute() {
  return <BrandsPage />;
}
