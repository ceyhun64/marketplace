import FlashSalePage from "@/components/modules/flash-sale/FlashSalePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flash Sale — Marketplace",
  description: "Check out our limited-time flash sales and exclusive deals.",

};


export default function FlashSaleRoute() {
  return <FlashSalePage />;
}
