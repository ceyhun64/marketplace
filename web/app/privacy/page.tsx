import PrivacyPolicyPage from "@/components/modules/privacy/PrivacyPolicyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Marketplace",
  description:
    "How we collect, use, and protect your personal data. Read our full privacy policy.",
};

export default function PrivacyRoute() {
  return <PrivacyPolicyPage />;
}
