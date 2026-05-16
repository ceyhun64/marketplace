import FlashSalePage from "@/components/modules/flash-sale/FlashSalePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flash Sale — Marketplace",
  description:
    "Limited-time flash sales with massive discounts. New deals every hour — don't miss out.",
  openGraph: {
    title: "Flash Sale — BAZR Marketplace",
    description: "Massive discounts, limited time. Shop the flash sale now.",
    type: "website",
  },
};

export default function FlashSaleRoute() {
  return <FlashSalePage />;
}
