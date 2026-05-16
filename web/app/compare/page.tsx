import ComparePage from "@/components/modules/compare/ComparePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Products — Marketplace",
  description:
    "Compare products side by side. View specs, prices, ratings, and reviews to make the best buying decision.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Compare Products — BAZR Marketplace",
    description:
      "Compare specs, prices, and reviews side by side to find the best product.",
    type: "website",
  },
};

export default function CompareRoute() {
  return <ComparePage />;
}
