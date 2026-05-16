import ContactPage from "@/components/modules/contact/ContactPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Marketplace",
  description:
    "Get in touch with the BAZR Marketplace team. We respond within 24 hours on business days.",
  openGraph: {
    title: "Contact BAZR Marketplace",
    description:
      "Reach the BAZR team — we respond within 24 hours on business days.",
    type: "website",
  },
};

export default function ContactRoute() {
  return <ContactPage />;
}
