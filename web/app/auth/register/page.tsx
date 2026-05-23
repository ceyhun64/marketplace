import RegisterPage from "@/components/modules/auth/RegisterPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — Marketplace",
  description: "Create a new BAZR account. Join our community today.",
  robots: { index: false, follow: false },
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
