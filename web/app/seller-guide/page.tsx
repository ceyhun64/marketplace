import SellerGuidePage from "@/components/modules/seller-guide/SellerGuidePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Guide — Marketplace",
  description:
    "Learn how to sell on Marketplace — from applying for a merchant account to listing products, fulfilling orders, and growing your store.",
};

export default function SellerGuideRoute() {
  return <SellerGuidePage />;
}
