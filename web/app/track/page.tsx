import TrackPage from "@/components/modules/track/TrackPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order — Marketplace",
  description:
    "Enter your tracking number to see real-time delivery status of your BAZR Marketplace order.",
  openGraph: {
    title: "Track Your Order — BAZR Marketplace",
    description: "Real-time order tracking for BAZR Marketplace shipments.",
    type: "website",
  },
};

export default function TrackRoute() {
  return <TrackPage />;
}
