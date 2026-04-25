"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const HIDDEN_PATHS = [
  "/admin",
  "/checkout",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/merchant",
  "/courier",
];

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";

  const shouldHideLayout = HIDDEN_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  return (
    <>
      {!shouldHideLayout && <Navbar />}

      {children}

      {!shouldHideLayout && <Footer />}
    </>
  );
}
