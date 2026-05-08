import AboutPage from "@/components/modules/about/AboutPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Marketplace",
  description:
    "Our story, mission, and the values behind the marketplace. Built for sellers, loved by buyers.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
