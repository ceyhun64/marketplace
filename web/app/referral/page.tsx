import ReferralPage from "@/components/modules/referral/ReferralPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program — Marketplace",
  description:
    "Earn rewards and discounts by referring friends and family to Marketplace.",
};

export default function ReferralRoute() {
  return <ReferralPage />;
}
