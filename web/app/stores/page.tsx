import StoresListPage from "@/components/modules/stores/StoresListPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Stores — Marketplace",
  description:
    "Discover independent stores from our trusted sellers on BAZR Marketplace.",
  openGraph: {
    title: "All Stores — BAZR Marketplace",
    description:
      "Browse and follow your favourite independent stores on BAZR Marketplace.",
    type: "website",
  },
};

export default function StoresRoute() {
  return <StoresListPage />;
}
