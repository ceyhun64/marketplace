import SubscriptionPlansPage from "@/components/modules/subscription/SubscriptionPlansPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Plans — Marketplace",
  description:
    "Compare Basic, Pro, and Enterprise merchant plans. Start free, unlock the public marketplace, custom domains, and advanced analytics.",
};

export default function SubscriptionPlansRoute() {
  return <SubscriptionPlansPage />;
}
