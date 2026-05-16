import LoyaltyPage from "@/components/modules/loyalty/LoyaltyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty Program — Marketplace",
  description:
    "Earn points on every purchase and redeem them for discounts and exclusive rewards on BAZR Marketplace.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Loyalty Program — BAZR Marketplace",
    description:
      "Earn points on every purchase and unlock exclusive rewards.",
    type: "website",
  },
};

export default function LoyaltyRoute() {
  return <LoyaltyPage />;
}
