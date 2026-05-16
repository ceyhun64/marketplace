import CheckoutPage from "@/components/modules/checkout/CheckoutPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — Marketplace",
  description:
    "Complete your purchase securely. Fast, safe checkout with multiple payment options.",
  robots: { index: false, follow: false },
};

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
