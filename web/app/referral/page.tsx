import ReferralPage from "@/components/modules/referral/ReferralPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program — Marketplace",
  description:
    "Earn rewards and discounts by referring friends and family to BAZR Marketplace.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Refer & Earn — BAZR Marketplace",
    description:
      "Share your referral link and earn rewards for every friend who joins.",
    type: "website",
  },
};

export default function ReferralRoute() {
  return <ReferralPage />;
}
