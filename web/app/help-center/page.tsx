import HelpCenterPage from "@/components/modules/help-center/HelpCenterPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center — Marketplace",
  description:
    "Find answers to common questions about orders, shipping, returns, payments, and selling on BAZR Marketplace.",
  openGraph: {
    title: "Help Center — BAZR Marketplace",
    description:
      "Everything you need to know about shopping and selling on BAZR Marketplace.",
    type: "website",
  },
};

export default function HelpCenterRoute() {
  return <HelpCenterPage />;
}
