import LoginPage from "@/components/modules/auth/LoginPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — Marketplace",
  description: "Sign in to your BAZR account.",
  robots: { index: false, follow: false },
};

export default function LoginRoute() {
  return <LoginPage />;
}
