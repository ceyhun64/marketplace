import ComparePage from "@/components/modules/compare/ComparePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Products — Marketplace",
  description:
    "Compare products side by side. View specs, prices, ratings, and reviews to make the best buying decision.",
};

export default function CompareRoute() {
  return <ComparePage />;
}
