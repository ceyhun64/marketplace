import BestsellersPage from "@/components/modules/bestsellers/BestsellersPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Sellers — Marketplace",
  description:
    "Discover our most-loved products ranked by sales and customer ratings. Updated weekly.",
  openGraph: {
    title: "Best Sellers — Marketplace",
    description:
      "Top-ranked products by sales and reviews on BAZR Marketplace.",
    type: "website",
  },
};

export default function BestsellersRoute() {
  return <BestsellersPage />;
}
