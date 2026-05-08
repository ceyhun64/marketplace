import ReturnsPage from "@/components/modules/returns/ReturnsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds — Marketplace",
  description:
    "Our return and refund policy. Learn how to return an item, what's eligible, and how quickly you'll receive your refund.",
};

export default function ReturnsRoute() {
  return <ReturnsPage />;
}
