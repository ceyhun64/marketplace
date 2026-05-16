import AboutPage from "@/components/modules/about/AboutPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Marketplace",
  description:
    "Our story, mission, and the values behind the marketplace. Built for sellers, loved by buyers.",
  openGraph: {
    title: "About BAZR Marketplace",
    description:
      "Learn about our story, mission, and the values behind BAZR Marketplace.",
    type: "website",
  },
};

export default function AboutRoute() {
  return <AboutPage />;
}
