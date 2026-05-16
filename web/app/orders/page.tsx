import OrdersPage from "@/components/modules/orders/OrdersPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders — Marketplace",
  description:
    "View and track all your orders. Manage returns and check delivery status.",
  robots: { index: false, follow: false },
};

export default function OrdersRoute() {
  return <OrdersPage />;
}
