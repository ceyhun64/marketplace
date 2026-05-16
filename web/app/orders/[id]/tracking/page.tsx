import OrderTrackingPage from "@/components/modules/orders/OrderTrackingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order — Marketplace",
  description: "Real-time shipment tracking for your BAZR order.",
  robots: { index: false, follow: false },
};

export default function OrderTrackingRoute() {
  return <OrderTrackingPage />;
}
