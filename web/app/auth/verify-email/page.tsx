import VerifyEmailPage from "@/components/modules/auth/VerifyEmailPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email — Marketplace",
  description: "Verify your email address to activate your Marketplace account.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailRoute() {
  return <VerifyEmailPage />;
}
