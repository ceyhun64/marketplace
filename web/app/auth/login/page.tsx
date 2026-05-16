import LoginPage from "@/components/modules/auth/LoginPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Marketplace",
  description:
    "Sign in to your BAZR account to shop, track orders, and manage your profile.",
  robots: { index: false, follow: false },
};

export default function LoginRoute() {
  return <LoginPage />;
}
