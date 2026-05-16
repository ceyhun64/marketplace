import GiftCardsPage from "@/components/modules/gift-cards/GiftCardsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Cards — Marketplace",
  description:
    "Send the perfect gift. Choose an amount, pick a design, and deliver instantly by email. Gift cards never expire.",
  openGraph: {
    title: "Gift Cards — BAZR Marketplace",
    description:
      "Give the gift of choice. Digital gift cards delivered instantly by email.",
    type: "website",
  },
};

export default function GiftCardsRoute() {
  return <GiftCardsPage />;
}
