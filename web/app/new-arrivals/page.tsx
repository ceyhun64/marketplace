import NewArrivalsPage from "@/components/modules/new-arrivals/NewArrivalsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Arrivals — Marketplace",
  description:
    "Fresh products added daily from our verified sellers. Be the first to discover the latest arrivals.",
  openGraph: {
    title: "New Arrivals — Marketplace",
    description: "Discover the latest products from BAZR Marketplace sellers.",
    type: "website",
  },
};

export default function NewArrivalsRoute() {
  return <NewArrivalsPage />;
}
