import CartPage from "@/components/modules/cart/CartPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart — Marketplace",
  description:
    "Review items in your cart, apply coupons, and proceed to checkout.",
  robots: { index: false, follow: false },
};

export default function CartRoute() {
  return <CartPage />;
}
