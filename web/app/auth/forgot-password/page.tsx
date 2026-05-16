import ForgotPasswordPage from "@/components/modules/auth/ForgotPasswordPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password — Marketplace",
  description:
    "Reset your BAZR account password. Enter your email and we'll send you a reset link.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
