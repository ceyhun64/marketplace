import FAQPage from "@/components/modules/faq/FaqPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions — Marketplace",
  description:
    "Answers to common questions about orders, shipping, returns, payments, and selling on BAZR Marketplace.",
};

export default function FAQRoute() {
  return <FAQPage />;
}
