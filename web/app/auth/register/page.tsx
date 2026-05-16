import RegisterPage from "@/components/modules/auth/RegisterPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Marketplace",
  description:
    "Join BAZR Marketplace. Create a free account to start shopping from thousands of verified sellers.",
  robots: { index: false, follow: false },
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
