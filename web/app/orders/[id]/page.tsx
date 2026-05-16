import OrderDetailPage from "@/components/modules/orders/OrderDetailPage";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id} — Marketplace`,
    description: "View details, status, and tracking for your order.",
    robots: { index: false, follow: false },
  };
}

export default function OrderDetailRoute() {
  return <OrderDetailPage />;
}
