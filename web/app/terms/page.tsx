// app/terms/page.tsx — Kullanım Koşulları sayfası
import type { Metadata } from "next";
import TermsPage from "@/components/modules/terms/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service — Marketplace",
  description:
    "Read the terms and conditions governing your use of BAZR Marketplace, including buyer and seller obligations, payment terms, and dispute resolution.",
  robots: { index: true, follow: false },
};

export default function TermsRoute() {
  return <TermsPage />;
}
