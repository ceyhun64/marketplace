import TermsPage from "@/components/modules/terms/TermsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Marketplace",
  description:
    "Read our Terms of Service. Understand your rights and obligations as a buyer or seller on the Marketplace platform.",
};

export default function TermsRoute() {
  return <TermsPage />;
}
