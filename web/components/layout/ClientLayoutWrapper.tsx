"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import CookieConsent from "@/components/layout/CookieConsent";
import SocialProof from "@/components/layout/SocialProof";
import BackToTop from "@/components/layout/BackToTop";

const HIDDEN_PATHS = [
  "/admin",
  "/checkout",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/merchant",
  "/courier",
  "/unauthorized",
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
      {!shouldHideLayout && <AnnouncementBar />}
      {!shouldHideLayout && <Navbar />}

      {children}

      {!shouldHideLayout && <Footer />}

      {/* Global overlays — shown everywhere */}
      <CookieConsent />
      <SocialProof />
      <BackToTop />
    </>
  );
}
