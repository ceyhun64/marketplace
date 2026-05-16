import ResetPasswordPage from "@/components/modules/auth/ResetPasswordPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — Marketplace",
  description: "Set a new password for your BAZR Marketplace account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordRoute() {
  return <ResetPasswordPage />;
}
