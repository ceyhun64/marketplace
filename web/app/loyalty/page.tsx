import LoyaltyPage from "@/components/modules/loyalty/LoyaltyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty — Marketplace",
  description: "View your loyalty rewards, points, and exclusive offers.",
};


export default function LoyaltyRoute() {
  return <LoyaltyPage />;
}
