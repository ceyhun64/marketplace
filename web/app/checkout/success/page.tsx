import { Suspense } from "react";
import type { Metadata } from "next";
import OrderSuccessPage from "@/components/modules/checkout/OrderSuccessPage";

export const metadata: Metadata = {
  title: "Order Confirmed — BAZR",
  description: "Your order has been successfully placed.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessRoute() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--off-white)" }}
        >
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(51,51,51,0.1)",
              borderTopColor: "var(--charcoal)",
            }}
          />
        </div>
      }
    >
      <OrderSuccessPage />
    </Suspense>
  );
}
