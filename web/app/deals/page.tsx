import DealsPage from "@/components/modules/deals/DealsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Deals — Marketplace",
  description:
    "Hand-picked deals and featured offers from our top sellers. Limited stock — don't miss out.",
  openGraph: {
    title: "Today's Deals — BAZR Marketplace",
    description:
      "Hand-picked deals and featured offers from top BAZR Marketplace sellers.",
    type: "website",
  },
};

export default function DealsRoute() {
  return <DealsPage />;
}
